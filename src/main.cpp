#include <Geode/Geode.hpp>
#include <Geode/modify/EditorUI.hpp>
#include <Geode/modify/TextGameObject.hpp>
#include <Geode/modify/PlayLayer.hpp>
#include <Geode/binding/CreateMenuItem.hpp>
#include <Geode/binding/EditButtonBar.hpp>
#include <Geode/binding/FMODAudioEngine.hpp>
#include <Geode/fmod/fmod.hpp>
#include <filesystem>
#include <fstream>
#include <unordered_map>
#include <unordered_set>
#include <thread>
#include <chrono>
#include <csignal>
#include "TriggerCodec.hpp"
#include "TriggerPopup.hpp"

using namespace geode::prelude;
namespace fs = std::filesystem;

static constexpr int SAVE_BUTTON_ID  = 14991;
static constexpr int LOAD_BUTTON_ID  = 14992;
static constexpr int CRASH_BUTTON_ID = 14993;

struct RuntimeEntry {
    geode::Ref<TextGameObject> object;
    ZptTrigger trigger;
};
static std::vector<RuntimeEntry> g_entries;
static std::unordered_set<TextGameObject*> g_fired;
static bool g_setupDone = false;

static fs::path valuesPath() { return Mod::get()->getSaveDir() / "persistent-values.json"; }

static std::unordered_map<int,int> loadValues() {
    std::unordered_map<int,int> out;
    std::ifstream f(valuesPath());
    if (!f.good()) return out;
    std::string s((std::istreambuf_iterator<char>(f)), {});
    auto parsed = matjson::parse(s);
    if (!parsed) return out;
    auto obj = parsed.unwrap();
    if (!obj.isObject()) return out;
    for (auto const& [k, v] : obj.asObject().unwrap()) {
        try {
            if (v.isNumber()) out[std::stoi(k)] = static_cast<int>(v.asInt().unwrap());
        } catch (...) {}
    }
    return out;
}

static bool saveValueSync(int id, int value) {
    auto all = loadValues();
    all[id] = value;
    matjson::Value root = matjson::makeObject({});
    for (auto const& [k,v] : all) root[std::to_string(k)] = v;
    auto dir = Mod::get()->getSaveDir();
    std::error_code ec;
    fs::create_directories(dir, ec);
    auto tmp = dir / "persistent-values.json.tmp";
    {
        std::ofstream f(tmp, std::ios::binary | std::ios::trunc);
        if (!f.good()) return false;
        auto text = root.dump();
        f.write(text.data(), static_cast<std::streamsize>(text.size()));
        f.flush();
        if (!f.good()) return false;
    }
    fs::remove(valuesPath(), ec);
    ec.clear();
    fs::rename(tmp, valuesPath(), ec);
    return !ec;
}

static void tryAudioStutter(int loopMs) {
    auto engine = FMODAudioEngine::get();
    if (!engine || !engine->m_backgroundMusicChannel) return;
    int count = 0;
    if (engine->m_backgroundMusicChannel->getNumChannels(&count) != FMOD_OK || count <= 0) return;
    FMOD::Channel* ch = nullptr;
    if (engine->m_backgroundMusicChannel->getChannel(0, &ch) != FMOD_OK || !ch) return;
    unsigned pos = 0;
    if (ch->getPosition(&pos, FMOD_TIMEUNIT_MS) != FMOD_OK) return;
    FMOD::Sound* sound = nullptr;
    if (ch->getCurrentSound(&sound) != FMOD_OK || !sound) return;
    auto start = pos > static_cast<unsigned>(loopMs) ? pos - static_cast<unsigned>(loopMs) : 0u;
    sound->setLoopPoints(start, FMOD_TIMEUNIT_MS, pos, FMOD_TIMEUNIT_MS);
    ch->setMode(FMOD_LOOP_NORMAL);
    ch->setLoopCount(-1);
    ch->setPosition(start, FMOD_TIMEUNIT_MS);
}

[[noreturn]] static void forceQuitNow() {
#if defined(GEODE_IS_ANDROID)
    std::raise(SIGKILL);
#endif
    std::abort();
}

static void doCrash(int loopMs, int delayMs) {
    tryAudioStutter(loopMs);
    std::this_thread::sleep_for(std::chrono::milliseconds(delayMs));
    forceQuitNow();
}

static void registerObject(TextGameObject* obj) {
    auto p = parseZpt(obj->m_text);
    if (!p) return;
    for (auto& e : g_entries) if (e.object.data() == obj) { e.trigger = *p; return; }
    g_entries.push_back({obj, *p});
}

static void clearRuntime() {
    g_entries.clear();
    g_fired.clear();
    g_setupDone = false;
}

static void processLoads(PlayLayer* layer) {
    auto vals = loadValues();
    for (auto const& e : g_entries) {
        if (e.trigger.kind != ZptKind::Load) continue;
        auto it = vals.find(e.trigger.saveID);
        if (it != vals.end() && it->second == e.trigger.expected && layer->m_effectManager) {
            std::vector<int> remap;
            layer->m_effectManager->spawnGroup(e.trigger.groupID, 0.f, false, remap, 0, 0);
        }
    }
}

class $modify(ZptTextGameObject, TextGameObject) {
    void styleZpt() {
        auto p = parseZpt(m_text);
        if (!p) return;
        m_addToNodeContainer = true;
        m_detailColor = nullptr;
        m_isTrigger = true;
        for (auto child : getChildrenExt()) child->setVisible(false);

        auto bg = CCSprite::createWithSpriteFrameName("GJ_square01.png");
        if (bg) {
            bg->setScale(.68f);
            bg->setOpacity(210);
            bg->setID("zpt-bg"_spr);
            addChild(bg, 1);
            bg->setPosition({0.f, 0.f});
        }
        auto label = CCLabelBMFont::create(zptLabel(*p).c_str(), "bigFont.fnt");
        label->setScale(.38f);
        label->setID("zpt-label"_spr);
        addChild(label, 2);
        registerObject(this);
    }

    void customObjectSetup(gd::vector<gd::string>& values, gd::vector<void*>& exists) {
        TextGameObject::customObjectSetup(values, exists);
        styleZpt();
    }

    void updateTextObject(gd::string text, bool p1) {
        TextGameObject::updateTextObject(text, p1);
        if (auto old = getChildByIDRecursive("zpt-bg"_spr)) old->removeFromParent();
        if (auto old = getChildByIDRecursive("zpt-label"_spr)) old->removeFromParent();
        styleZpt();
    }
};

class $modify(ZptEditorUI, EditorUI) {
    static CreateMenuItem* labeledBtn(EditorUI* self, int fakeID, char const* text) {
        auto btn = self->getCreateBtn(1, 4);
        auto buttonSpr = static_cast<ButtonSprite*>(btn->getNormalImage());
        if (buttonSpr->m_subSprite) buttonSpr->m_subSprite->setVisible(false);
        auto lab = CCLabelBMFont::create(text, "bigFont.fnt");
        lab->setScale(.32f);
        lab->setPosition({20.f, 20.f});
        buttonSpr->addChild(lab);
        btn->m_objectID = fakeID;
        btn->setTag(fakeID);
        return btn;
    }

    void setupCreateMenu() {
        EditorUI::setupCreateMenu();
        if (!Mod::get()->getSettingValue<bool>("editor-ui")) return;
        auto bars = CCArrayExt<EditButtonBar*>(m_createButtonBars);
        if (bars.size() <= 12) return;
        auto bar = bars[12];
        for (auto [id, name] : std::initializer_list<std::pair<int,char const*>>{{SAVE_BUTTON_ID,"SAVE"},{LOAD_BUTTON_ID,"LOAD"},{CRASH_BUTTON_ID,"CRASH"}}) {
            auto btn = labeledBtn(this, id, name);
            m_createButtonArray->addObject(btn);
            bar->m_buttonArray->addObject(btn);
        }
        bar->reloadItems(GameManager::get()->getIntGameVariable("0049"), GameManager::get()->getIntGameVariable("0050"));
    }

    void onCreateObject(int objectID) {
        if (objectID != SAVE_BUTTON_ID && objectID != LOAD_BUTTON_ID && objectID != CRASH_BUTTON_ID)
            return EditorUI::onCreateObject(objectID);
        EditorUI::onCreateObject(914);
        if (!m_selectedObject) return;
        auto t = static_cast<TextGameObject*>(m_selectedObject);
        ZptTrigger z{};
        if (objectID == SAVE_BUTTON_ID) z.kind = ZptKind::Save;
        else if (objectID == LOAD_BUTTON_ID) z.kind = ZptKind::Load;
        else { z.kind = ZptKind::Crash; z.loopMs = 10; z.delayMs = 1000; }
        t->updateTextObject(encodeZpt(z), false);
    }

    void editObject(CCObject* sender) {
        if (m_selectedObject && m_selectedObject->m_objectID == 914) {
            auto t = static_cast<TextGameObject*>(m_selectedObject);
            if (parseZpt(t->m_text)) {
                ZptTriggerPopup::create(t)->show();
                return;
            }
        }
        EditorUI::editObject(sender);
    }
};

class $modify(ZptPlayLayer, PlayLayer) {
    bool init(GJGameLevel* level, bool useReplay, bool dontCreateObjects) {
        clearRuntime();
        return PlayLayer::init(level, useReplay, dontCreateObjects);
    }

    void setupHasCompleted() {
        PlayLayer::setupHasCompleted();
        g_setupDone = true;
        processLoads(this);
    }

    void update(float dt) {
        PlayLayer::update(dt);
        if (!g_setupDone || !m_player1) return;
        float px = m_player1->getPositionX();
        for (auto const& e : g_entries) {
            if (!e.object || g_fired.contains(e.object.data())) continue;
            if (e.trigger.kind == ZptKind::Load) continue;
            if (px + 2.f < e.object->getPositionX()) continue;
            g_fired.insert(e.object.data());
            if (e.trigger.kind == ZptKind::Save) {
                if (!saveValueSync(e.trigger.saveID, e.trigger.value))
                    log::error("Persistent Triggers: failed to save ID {}", e.trigger.saveID);
            } else if (e.trigger.kind == ZptKind::Crash) {
                doCrash(e.trigger.loopMs, e.trigger.delayMs);
            }
        }
    }
};
