
/**
 * DNA_object_types.h
 * 
 * This is the CORE Data Structure of Blender.
 * Any change here alters the binary file format (.blend).
 * 
 * VZOR MODIFICATION: Added Construction Data Layer
 */

#ifndef __DNA_OBJECT_TYPES_H__
#define __DNA_OBJECT_TYPES_H__

#include "DNA_defs.h"
#include "DNA_listBase.h"
#include "DNA_ID.h"

struct BoundBox;
struct AnimData;
struct Ipo;
struct Material;
struct VzorConstructionData; // Forward Declaration

/* -------------------------------------------------------------------- */
/* Object Structure */

typedef struct Object {
  ID id;
  struct AnimData *adt;
  
  /* ... Standard Blender Fields (Type, Matrix, etc.) ... */
  short type;
  float obmat[4][4];
  
  /* VZOR SPECIFIC DATA BLOCK */
  /* We inject our business logic directly into the kernel memory layout */
  
  /* 1. Direct Properties (Fast Access) */
  float vzor_cost;           // Calculated cost
  int vzor_status;           // 0=Planned, 1=In-Progress, 2=Done
  char vzor_uuid[32];        // Sync with External DB
  
  /* 2. Pointer to complex Construction Data (Lazy Loaded) */
  struct VzorConstructionData *construction_data; 

} Object;

/* VZOR: Extended Data Structure */
typedef struct VzorConstructionData {
    float concrete_volume;
    float steel_weight;
    char contractor_name[64];
    double last_audit_timestamp;
} VzorConstructionData;

#endif
