from typing import Dict, Any
from .graph_manager import GraphManager

class AgentOrchestrator:
    def __init__(self):
        self.graph_manager = GraphManager()

    def generate_graph_from_prompt(self, prompt: str) -> Dict[str, Any]:
        """
        Generates a graph structure based on the user prompt.
        Currently mocks the LLM behavior.
        """
        # Reset graph
        self.graph_manager = GraphManager()
        
        print(f"VZOR: Generating graph for prompt: '{prompt}'")
        
        # Mock logic based on keywords
        investor = self.graph_manager.create_node("Agent", "Investor Input", 100, 100)
        
        if "analyze" in prompt.lower() or "analysis" in prompt.lower():
            analysis = self.graph_manager.create_node("Agent", "ROI Analysis", 400, 100)
            self.graph_manager.add_edge(investor.id, "Next", analysis.id, "Trigger")
            self.graph_manager.add_edge(investor.id, "Out", analysis.id, "In")
            
            export = self.graph_manager.create_node("Node_Export_Data", "Save Report", 700, 100)
            self.graph_manager.add_edge(analysis.id, "Next", export.id, "Trigger")
            self.graph_manager.add_edge(analysis.id, "Out", export.id, "Data")
            
        elif "build" in prompt.lower() or "design" in prompt.lower():
            architect = self.graph_manager.create_node("Agent", "Architect", 400, 100)
            self.graph_manager.add_edge(investor.id, "Next", architect.id, "Trigger")
            
            export = self.graph_manager.create_node("Node_Export_Geometry", "Export Model", 700, 100)
            self.graph_manager.add_edge(architect.id, "Next", export.id, "Trigger")
            
            # Assuming Architect outputs geometry for now (mock)
            # In real impl, we'd check outputs
            
        return self.graph_manager.to_json()

    def execute_graph(self, graph_data: Dict[str, Any]):
        print("VZOR: Executing graph...")
        # TODO: Implement topological sort and execution
        pass
