
/**
 * GHOST_SystemWeb.cpp
 * 
 * The Bridge between C++ Kernel and Browser JS.
 * Uses Emscripten Embind.
 */

#include <emscripten/bind.h>
#include "BKE_main.h"
#include "BKE_context.h"
#include "DNA_object_types.h"

using namespace emscripten;

/* The API exposed to React */
class VzorBridge {
public:
    VzorBridge() {
        // Initialize minimal Blender Kernel
        BKE_blender_globals_init();
    }

    /* 1. Data Injection */
    void setObjectCost(std::string name, float cost) {
        Object *ob = (Object *)BKE_libblock_find_name(G.main, ID_OB, name.c_str());
        if (ob) {
            ob->vzor_cost = cost;
            // Mark graph for update
            DEG_id_tag_update(&ob->id, ID_RECALC_COPY_ON_WRITE);
        }
    }

    /* 2. Data Retrieval */
    float getObjectCost(std::string name) {
        Object *ob = (Object *)BKE_libblock_find_name(G.main, ID_OB, name.c_str());
        return ob ? ob->vzor_cost : -1.0f;
    }

    /* 3. Heavy Calculation (C++ Speed) */
    float calculateTotalBudget() {
        float total = 0.0f;
        Object *ob;
        for (ob = (Object *)G.main->objects.first; ob; ob = ob->id.next) {
            if (ob->vzor_status == 1) { // Only Active
                 total += ob->vzor_cost;
            }
        }
        return total;
    }
};

/* Emscripten Binding Module */
EMSCRIPTEN_BINDINGS(vzor_core) {
    class_<VzorBridge>("VzorKernel")
        .constructor<>()
        .function("setObjectCost", &VzorBridge::setObjectCost)
        .function("getObjectCost", &VzorBridge::getObjectCost)
        .function("calculateTotalBudget", &VzorBridge::calculateTotalBudget);
}
