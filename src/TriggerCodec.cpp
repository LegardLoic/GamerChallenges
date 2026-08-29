#include "TriggerCodec.hpp"
#include <charconv>
#include <vector>
#include <string_view>

static std::vector<std::string_view> split(std::string_view s, char c) {
    std::vector<std::string_view> out;
    size_t start = 0;
    while (start <= s.size()) {
        auto p = s.find(c, start);
        if (p == std::string_view::npos) p = s.size();
        out.push_back(s.substr(start, p - start));
        if (p == s.size()) break;
        start = p + 1;
    }
    return out;
}

static bool toInt(std::string_view s, int& v) {
    auto [p, ec] = std::from_chars(s.data(), s.data() + s.size(), v);
    return ec == std::errc{} && p == s.data() + s.size();
}

std::optional<ZptTrigger> parseZpt(std::string const& text) {
    auto p = split(text, ':');
    if (p.size() < 2 || p[0] != "zpt") return std::nullopt;
    ZptTrigger t{};
    if (p[1] == "save" && p.size() == 4) {
        t.kind = ZptKind::Save;
        if (!toInt(p[2], t.saveID) || !toInt(p[3], t.value)) return std::nullopt;
    } else if (p[1] == "load" && p.size() == 5) {
        t.kind = ZptKind::Load;
        if (!toInt(p[2], t.saveID) || !toInt(p[3], t.expected) || !toInt(p[4], t.groupID)) return std::nullopt;
    } else if (p[1] == "crash" && p.size() == 4) {
        t.kind = ZptKind::Crash;
        if (!toInt(p[2], t.loopMs) || !toInt(p[3], t.delayMs)) return std::nullopt;
        if (t.loopMs < 1) t.loopMs = 1;
        if (t.loopMs > 250) t.loopMs = 250;
        if (t.delayMs < 0) t.delayMs = 0;
        if (t.delayMs > 10000) t.delayMs = 10000;
    } else return std::nullopt;
    return t;
}

std::string encodeZpt(ZptTrigger const& t) {
    switch (t.kind) {
        case ZptKind::Save:  return "zpt:save:" + std::to_string(t.saveID) + ":" + std::to_string(t.value);
        case ZptKind::Load:  return "zpt:load:" + std::to_string(t.saveID) + ":" + std::to_string(t.expected) + ":" + std::to_string(t.groupID);
        case ZptKind::Crash: return "zpt:crash:" + std::to_string(t.loopMs) + ":" + std::to_string(t.delayMs);
    }
    return {};
}

std::string zptLabel(ZptTrigger const& t) {
    switch (t.kind) {
        case ZptKind::Save: return "SAVE";
        case ZptKind::Load: return "LOAD";
        case ZptKind::Crash: return "CRASH";
    }
    return "ZPT";
}
