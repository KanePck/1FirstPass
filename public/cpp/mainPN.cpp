#include <node_api.h>

Napi::Object InitAll(Napi::Env env, Napi::Object exports) {
	return exports;
}

NODE_API_MODULE(pwdNomore, InitAll)