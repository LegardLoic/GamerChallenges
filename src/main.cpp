#include <Geode/Geode.hpp>
#include <Geode/modify/GJEffectManager.hpp>
#include <Geode/modify/PlayLayer.hpp>
#include <Geode/binding/FMODAudioEngine.hpp>
#include <Geode/fmod/fmod.hpp>
#include <chrono>
#include <csignal>
#include <thread>

using namespace geode::prelude;

static constexpr int LOAD_FLAG_ITEM_ID  = 8885;
static constexpr int CRASH_FLAG_ITEM_ID = 8886;
static constexpr int SAVE_FLAG_ITEM_ID  = 8888;

struct SavedItem {
    int itemID;
    int value;
};

struct SavedItems {
    std::vector<SavedItem> items;
};

template <>
struct matjson::Serialize<SavedItem> {
    static Result<SavedItem> fromJson(matjson::Value const& value) {
        GEODE_UNWRAP_INTO(int itemID, value["itemID"].asInt());
        GEODE_UNWRAP_INTO(int val, value["value"].asInt());
        return Ok(SavedItem{itemID, val});
    }

    static matjson::Value toJson(SavedItem const& value) {
        matjson::Value obj;
        obj["itemID"] = value.itemID;
        obj["value"] = value.value;
        return obj;
    }
};

template <>
struct matjson::Serialize<SavedItems> {
    static Result<SavedItems> fromJson(matjson::Value const& value) {
        GEODE_UNWRAP_INTO(std::vector<SavedItem> items, value["items"].as<std::vector<SavedItem>>());
        return Ok(SavedItems{items});
    }

    static matjson::Value toJson(SavedItems const& value) {
        matjson::Value obj;
        obj["items"] = value.items;
        return obj;
    }
};

static bool isControlItem(int id) {
    return id == LOAD_FLAG_ITEM_ID || id == CRASH_FLAG_ITEM_ID || id == SAVE_FLAG_ITEM_ID;
}

static int getItemValue(GJEffectManager* mgr, int itemID) {
    if (!mgr) return 0;
    if (auto it = mgr->m_itemCountMap.find(itemID); it != mgr->m_itemCountMap.end())
        return it->second;
    return 0;
}

static std::string saveKey(GJBaseGameLayer* layer) {
    int levelID = 0;
    if (layer && layer->m_level) levelID = layer->m_level->m_levelID;
    return fmt::format("level-{}-items", levelID);
}

static void saveItemStates(GJBaseGameLayer* layer) {
    if (!layer || !layer->m_effectManager) return;

    SavedItems data;
    for (auto const& [itemID, value] : layer->m_effectManager->m_itemCountMap) {
        if (isControlItem(itemID)) continue;
        data.items.push_back({itemID, value});
    }

    Mod::get()->setSavedValue(saveKey(layer), data);
    auto res = Mod::get()->saveData();
    if (res.isErr()) {
        log::error("Persistent Triggers: synchronous save failed: {}", res.unwrapErr());
    } else {
        log::info("Persistent Triggers: saved {} item states", data.items.size());
    }
}

static void restoreItemStates(GJBaseGameLayer* layer) {
    if (!layer || !layer->m_effectManager) return;

    auto data = Mod::get()->getSavedValue<SavedItems>(saveKey(layer), SavedItems{});
    for (auto const& item : data.items) {
        if (isControlItem(item.itemID)) continue;
        layer->m_effectManager->updateCountForItem(item.itemID, item.value);
        layer->updateCounters(item.itemID, item.value);
    }
    log::info("Persistent Triggers: restored {} item states", data.items.size());
}

static void tryAudioStutter(unsigned loopMs = 10) {
    auto engine = FMODAudioEngine::get();
    if (!engine || !engine->m_backgroundMusicChannel) return;

    int count = 0;
    if (engine->m_backgroundMusicChannel->getNumChannels(&count) != FMOD_OK || count <= 0) return;

    FMOD::Channel* channel = nullptr;
    if (engine->m_backgroundMusicChannel->getChannel(0, &channel) != FMOD_OK || !channel) return;

    unsigned pos = 0;
    if (channel->getPosition(&pos, FMOD_TIMEUNIT_MS) != FMOD_OK) return;

    FMOD::Sound* sound = nullptr;
    if (channel->getCurrentSound(&sound) != FMOD_OK || !sound) return;

    unsigned start = pos > loopMs ? pos - loopMs : 0u;
    sound->setLoopPoints(start, FMOD_TIMEUNIT_MS, pos, FMOD_TIMEUNIT_MS);
    channel->setMode(FMOD_LOOP_NORMAL);
    channel->setLoopCount(-1);
    channel->setPosition(start, FMOD_TIMEUNIT_MS);
}

[[noreturn]] static void forceQuitNow() {
#if defined(GEODE_IS_ANDROID)
    std::raise(SIGKILL);
#endif
    std::abort();
}

static void doCrash() {
    Mod::get()->saveData();
    tryAudioStutter(10);
    std::this_thread::sleep_for(std::chrono::milliseconds(1000));
    forceQuitNow();
}

class $modify(PersistentItemHook, GJEffectManager) {
    void updateCountForItem(int itemID, int value) {
        int prev = getItemValue(this, itemID);
        GJEffectManager::updateCountForItem(itemID, value);

        if (prev != 0 || value != 1) return;

        auto layer = static_cast<GJBaseGameLayer*>(PlayLayer::get());
        if (!layer) return;

        if (itemID == SAVE_FLAG_ITEM_ID) {
            saveItemStates(layer);
            GJEffectManager::updateCountForItem(SAVE_FLAG_ITEM_ID, 0);
            layer->updateCounters(SAVE_FLAG_ITEM_ID, 0);
        }
        else if (itemID == LOAD_FLAG_ITEM_ID) {
            restoreItemStates(layer);
            GJEffectManager::updateCountForItem(LOAD_FLAG_ITEM_ID, 0);
            layer->updateCounters(LOAD_FLAG_ITEM_ID, 0);
        }
        else if (itemID == CRASH_FLAG_ITEM_ID) {
            doCrash();
        }
    }
};

class $modify(PersistentPlayLayer, PlayLayer) {
    void setupHasCompleted() {
        PlayLayer::setupHasCompleted();
        restoreItemStates(this);
    }
};
