#include "TriggerPopup.hpp"
#include <cstdlib>
using namespace geode::prelude;

ZptTriggerPopup* ZptTriggerPopup::create(TextGameObject* object) {
    auto ret = new ZptTriggerPopup();
    if (ret && ret->init(object)) { ret->autorelease(); return ret; }
    delete ret;
    return nullptr;
}

TextInput* ZptTriggerPopup::addIntInput(char const* label, int value, CCPoint pos) {
    auto l = CCLabelBMFont::create(label, "bigFont.fnt");
    l->setScale(.35f);
    l->setAnchorPoint({0.f, .5f});
    l->setPosition({pos.x - 125.f, pos.y});
    m_mainLayer->addChild(l);

    auto input = TextInput::create(120.f, "0", "bigFont.fnt");
    input->setCommonFilter(CommonFilter::Int);
    input->setString(std::to_string(value));
    input->setPosition({pos.x + 60.f, pos.y});
    m_mainLayer->addChild(input);
    return input;
}

int ZptTriggerPopup::readInt(TextInput* input, int fallback) {
    if (!input) return fallback;
    try { return std::stoi(input->getString()); }
    catch (...) { return fallback; }
}

bool ZptTriggerPopup::init(TextGameObject* object) {
    auto parsed = parseZpt(object->m_text);
    if (!parsed) return false;
    m_trigger = *parsed;
    m_object = object;
    if (!Popup::init(360.f, 220.f)) return false;
    m_noElasticity = true;

    auto title = CCLabelBMFont::create((zptLabel(m_trigger) + " Trigger").c_str(), "bigFont.fnt");
    title->setScale(.55f);
    title->setPosition({180.f, 194.f});
    m_mainLayer->addChild(title);

    if (m_trigger.kind == ZptKind::Save) {
        m_a = addIntInput("Save ID", m_trigger.saveID, {180.f, 135.f});
        m_b = addIntInput("Value", m_trigger.value, {180.f, 90.f});
    } else if (m_trigger.kind == ZptKind::Load) {
        m_a = addIntInput("Save ID", m_trigger.saveID, {180.f, 145.f});
        m_b = addIntInput("Expected", m_trigger.expected, {180.f, 105.f});
        m_c = addIntInput("Spawn Group", m_trigger.groupID, {180.f, 65.f});
    } else {
        m_a = addIntInput("Loop ms", m_trigger.loopMs, {180.f, 135.f});
        m_b = addIntInput("Force quit after ms", m_trigger.delayMs, {180.f, 90.f});
    }

    auto ok = CCMenuItemExt::createSpriteExtra(ButtonSprite::create("OK"), [this](CCMenuItemSpriteExtra*) {
        this->onClose(nullptr);
    });
    ok->setPosition({180.f, 30.f});
    m_buttonMenu->addChild(ok);
    return true;
}

void ZptTriggerPopup::onClose(CCObject* sender) {
    if (m_trigger.kind == ZptKind::Save) {
        m_trigger.saveID = readInt(m_a, m_trigger.saveID);
        m_trigger.value = readInt(m_b, m_trigger.value);
    } else if (m_trigger.kind == ZptKind::Load) {
        m_trigger.saveID = readInt(m_a, m_trigger.saveID);
        m_trigger.expected = readInt(m_b, m_trigger.expected);
        m_trigger.groupID = readInt(m_c, m_trigger.groupID);
    } else {
        m_trigger.loopMs = std::clamp(readInt(m_a, m_trigger.loopMs), 1, 250);
        m_trigger.delayMs = std::clamp(readInt(m_b, m_trigger.delayMs), 0, 10000);
    }
    if (m_object) m_object->updateTextObject(encodeZpt(m_trigger), false);
    Popup::onClose(sender);
}
