from enum import Enum
from typing import List, Dict, Any, Optional
import json
import uuid

class SocketType(Enum):
    GEOMETRY = "RED"   # Mesh, IFC
    DATA = "BLUE"      # Numbers, Strings, Arrays
    FLOW = "WHITE"     # Execution Flow

class Node:
    def __init__(self, node_type: str, label: str, pos_x: float = 0, pos_y: float = 0):
        self.id = str(uuid.uuid4())
        self.type = node_type
        self.label = label
        self.position = {"x": pos_x, "y": pos_y}
        self.inputs: List[Dict[str, Any]] = []
        self.outputs: List[Dict[str, Any]] = []

    def add_input(self, name: str, socket_type: SocketType):
        self.inputs.append({"name": name, "type": socket_type.value})

    def add_output(self, name: str, socket_type: SocketType):
        self.outputs.append({"name": name, "type": socket_type.value})

    def to_dict(self):
        return {
            "id": self.id,
            "type": self.type,
            "label": self.label,
            "position": self.position,
            "inputs": self.inputs,
            "outputs": self.outputs
        }

class GraphManager:
    def __init__(self):
        self.nodes: Dict[str, Node] = {}
        self.edges: List[Dict[str, str]] = []

    def create_node(self, node_type: str, label: str, x: float = 0, y: float = 0) -> Node:
        node = Node(node_type, label, x, y)
        
        # Define standard sockets based on node type
        if node_type == "Node_Export_Geometry":
            node.add_input("Geometry", SocketType.GEOMETRY)
            node.add_input("Trigger", SocketType.FLOW)
        elif node_type == "Node_Export_Data":
            node.add_input("Data", SocketType.DATA)
            node.add_input("Trigger", SocketType.FLOW)
        elif node_type == "Agent":
             node.add_input("In", SocketType.DATA)
             node.add_input("Trigger", SocketType.FLOW)
             node.add_output("Out", SocketType.DATA)
             node.add_output("Next", SocketType.FLOW)
        
        self.nodes[node.id] = node
        return node

    def add_edge(self, source_id: str, source_handle: str, target_id: str, target_handle: str):
        # In a real impl, we would validate socket types here
        source_node = self.nodes.get(source_id)
        target_node = self.nodes.get(target_id)
        
        if not source_node or not target_node:
            raise ValueError("Node not found")
            
        # TODO: Strict type checking (Red->Red, etc)
        
        self.edges.append({
            "id": f"e_{source_id}_{target_id}_{uuid.uuid4()}",
            "source": source_id,
            "sourceHandle": source_handle,
            "target": target_id,
            "targetHandle": target_handle
        })

    def to_json(self) -> str:
        return json.dumps({
            "nodes": [n.to_dict() for n in self.nodes.values()],
            "edges": self.edges
        }, indent=2)

    def load_from_json(self, json_str: str):
        data = json.loads(json_str)
        # TODO: Implement loading logic
        pass
