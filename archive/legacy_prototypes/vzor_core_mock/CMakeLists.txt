
# CMakeLists.txt (Root)
# VZOR Optimization Profile

project(Blender)

# --- 1. STRIPPING FAT ---
# Disable Heavy Engines
set(WITH_CYCLES       OFF CACHE BOOL "" FORCE)
set(WITH_EEVEE        OFF CACHE BOOL "" FORCE)
set(WITH_COMPOSITOR   OFF CACHE BOOL "" FORCE)
set(WITH_SEQUENCER    OFF CACHE BOOL "" FORCE)

# Disable Modifiers/Simulation (Keep only Geometry Nodes if needed)
set(WITH_MOD_FLUID    OFF CACHE BOOL "" FORCE)
set(WITH_MOD_OCEAN    OFF CACHE BOOL "" FORCE)
set(WITH_MOD_CLOTH    OFF CACHE BOOL "" FORCE)

# Disable Desktop dependencies
set(WITH_GHOST_X11    OFF CACHE BOOL "" FORCE)
set(WITH_GHOST_WAYLAND OFF CACHE BOOL "" FORCE)
set(WITH_OPENMP       OFF CACHE BOOL "" FORCE) # WASM threading is tricky

# --- 2. ENABLE VZOR CORE ---
set(WITH_HEADLESS     ON  CACHE BOOL "" FORCE) # No UI drawing
set(WITH_PYTHON       OFF CACHE BOOL "" FORCE) # Pure C++ Logic (Faster load)
set(WITH_WASM         ON  CACHE BOOL "" FORCE) # Enable Emscripten Toolchain

# --- 3. COMPILER FLAGS ---
if(EMSCRIPTEN)
    # Optimize for size
    add_compile_options(-Os -flto)
    
    # Allow memory growth
    set(CMAKE_EXE_LINKER_FLAGS "${CMAKE_EXE_LINKER_FLAGS} -s ALLOW_MEMORY_GROWTH=1")
    
    # Export ES6 Module
    set(CMAKE_EXE_LINKER_FLAGS "${CMAKE_EXE_LINKER_FLAGS} -s EXPORT_ES6=1 -s MODULARIZE=1")
endif()
