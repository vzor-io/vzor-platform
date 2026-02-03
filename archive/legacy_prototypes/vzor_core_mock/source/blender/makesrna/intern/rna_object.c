
/**
 * rna_object.c
 * 
 * Defines how C structs from DNA are exposed to the API (Python/JS).
 * VZOR MODIFICATION: Exposing vzor_cost and status.
 */

#include "RNA_define.h"
#include "DNA_object_types.h"

void RNA_def_object(BlenderRNA *brna)
{
  StructRNA *srna;
  PropertyRNA *prop;

  srna = RNA_def_struct(brna, "Object", "ID");
  RNA_def_struct_ui_text(srna, "Object", "An object in the scene graph");

  /* ... Standard Blender Props ... */

  /* --- VZOR PROPERTIES --- */
  
  /* Cost Property */
  prop = RNA_def_property(srna, "vzor_cost", PROP_FLOAT, PROP_NONE);
  RNA_def_property_float_sdna(prop, NULL, "vzor_cost"); /* Maps to DNA struct member */
  RNA_def_property_ui_range(prop, 0.0f, 1000000000.0f, 1.0f, 2);
  RNA_def_property_ui_text(prop, "Construction Cost", "Estimated cost in USD");
  RNA_def_property_update(prop, NC_OBJECT | ND_DRAW, "rna_Object_vzor_update"); /* Trigger redraw on change */

  /* Status Enum */
  static const EnumPropertyItem vzor_status_items[] = {
      {0, "PLANNED", 0, "Planned", "Not started"},
      {1, "ACTIVE", 0, "In Progress", "Under construction"},
      {2, "DONE", 0, "Completed", "Finished"},
      {0, NULL, 0, NULL, NULL},
  };
  prop = RNA_def_property(srna, "vzor_status", PROP_ENUM, PROP_NONE);
  RNA_def_property_enum_sdna(prop, NULL, "vzor_status");
  RNA_def_property_enum_items(prop, vzor_status_items);
  RNA_def_property_ui_text(prop, "Status", "Construction Status");
}
