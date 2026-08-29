#pragma once
#include <string>
#include <optional>

enum class ZptKind { Save, Load, Crash };

struct ZptTrigger {
    ZptKind kind;
    int saveID = 1;
    int value = 1;
    int expected = 1;
    int groupID = 1;
    int loopMs = 10;
    int delayMs = 1000;
};

std::optional<ZptTrigger> parseZpt(std::string const& text);
std::string encodeZpt(ZptTrigger const& t);
std::string zptLabel(ZptTrigger const& t);
