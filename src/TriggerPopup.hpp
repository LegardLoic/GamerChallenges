#pragma once
#include <Geode/Geode.hpp>
#include <Geode/ui/Popup.hpp>
#include <Geode/ui/TextInput.hpp>
#include <Geode/binding/TextGameObject.hpp>
#include "TriggerCodec.hpp"

class ZptTriggerPopup : public geode::Popup {
public:
    static ZptTriggerPopup* create(TextGameObject* object);
protected:
    bool init(TextGameObject* object);
    void onClose(cocos2d::CCObject* sender) override;
private:
    geode::Ref<TextGameObject> m_object;
    ZptTrigger m_trigger{};
    geode::TextInput* m_a = nullptr;
    geode::TextInput* m_b = nullptr;
    geode::TextInput* m_c = nullptr;
    int readInt(geode::TextInput* input, int fallback);
    geode::TextInput* addIntInput(char const* label, int value, cocos2d::CCPoint pos);
};
