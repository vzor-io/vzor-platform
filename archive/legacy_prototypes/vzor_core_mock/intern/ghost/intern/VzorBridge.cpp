
/**
 * VzorBridge.cpp
 * 
 * FINAL PRODUCTION BRIDGE
 * Demonstrates:
 * 1. Data Modification (DNA)
 * 2. Event System (Callbacks to JS)
 * 3. Complex Data Structures
 */

#include <emscripten/bind.h>
#include <emscripten/val.h>
#include <vector>
#include <string>

using namespace emscripten;

// Mock Blender Types for standalone compilation if headers aren't strict
struct VzorObject {
    std::string name;
    float cost;
    int status; // 0=Planned, 1=Active
};

// Interface for JS Callback
// In simple Embind, passing a JS function directly is often easier using 'val'
// specific interfaces require 'allow_subclass' which adds complexity.
// We will use 'val' for the listener to keep it robust and flexible.

class VzorProjectManager {
private:
    std::vector<VzorObject> objects;
    val js_listener = val::null(); // The JS callback function

public:
    VzorProjectManager() {
        // Init Mock Data
        objects.push_back({"Foundation Block A", 50000.0, 1});
        objects.push_back({"Steel Beams L2", 120000.0, 0});
        objects.push_back({"Concrete Slab", 35000.0, 0});
    }

    // 1. Register Listener (React will pass a function here)
    void subscribe(val listener) {
        js_listener = listener;
    }

    // 2. Data Accessors for React
    val getObjects() {
        // Convert C++ vector to JS Array
        val js_array = val::array();
        for (size_t i = 0; i < objects.size(); ++i) {
            val obj = val::object();
            obj.set("name", objects[i].name);
            obj.set("cost", objects[i].cost);
            obj.set("status", objects[i].status);
            js_array.call<void>("push", obj);
        }
        return js_array;
    }

    // 3. Logic + Event Trigger
    void updateObjectCost(std::string name, float new_cost) {
        bool found = false;
        float total = 0;

        for (auto &obj : objects) {
            if (obj.name == name) {
                obj.cost = new_cost;
                found = true;
            }
            total += obj.cost;
        }

        // --- THE MAGIC: Calling JS from C++ ---
        if (found && !js_listener.isNull()) {
            val event = val::object();
            event.set("type", std::string("DATA_CHANGED"));
            event.set("delta_target", name);
            event.set("total_budget", total);
            
            // Fire and forget
            js_listener(event);
        }
    }
    
    // Simulate complex calculation
    void recalculateBudget() {
        // Allow thread to breathe? In WASM main thread, this blocks.
        // That's why we use Workers (next step).
        float total = 0;
        for (auto &obj : objects) total += obj.cost;
        
        if (!js_listener.isNull()) {
             val event = val::object();
             event.set("type", std::string("BUDGET_RECALC_DONE"));
             event.set("total", total);
             js_listener(event);
        }
    }
};

// Bindings
EMSCRIPTEN_BINDINGS(vzor_bridge_final) {
    class_<VzorProjectManager>("VzorProjectManager")
        .constructor<>()
        .function("subscribe", &VzorProjectManager::subscribe)
        .function("getObjects", &VzorProjectManager::getObjects)
        .function("updateObjectCost", &VzorProjectManager::updateObjectCost)
        .function("recalculateBudget", &VzorProjectManager::recalculateBudget);
}
