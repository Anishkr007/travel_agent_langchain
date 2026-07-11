from langsmith import Client
import json
from collections import defaultdict
from dotenv import load_dotenv
load_dotenv()

def analyze_traces():
    client = Client()
    runs = list(client.list_runs(
        project_name="travel-agent",
        execution_order=1, # Root runs
        limit=3
    ))
    
    if not runs:
        print("No traces found.")
        return
        
    print(f"Found {len(runs)} root traces.")
    
    for i, run in enumerate(reversed(runs)):
        print(f"\n--- Turn {i+1} ---")
        
        # We need to get the child runs to analyze tokens per node
        child_runs = list(client.list_runs(trace_id=run.trace_id))
        
        highest_tokens = 0
        highest_node = ""
        
        has_tavily = False
        tavily_output_len = 0
        
        for c in child_runs:
            # Check tokens
            tokens = c.prompt_tokens if c.prompt_tokens else 0
            if c.extra and "metadata" in c.extra:
                # sometimes tokens are in extra
                pass
            
            if hasattr(c, 'total_tokens') and c.total_tokens:
                total = c.total_tokens
                if total > highest_tokens:
                    highest_tokens = total
                    highest_node = c.name
                    
            if c.prompt_tokens and c.prompt_tokens > highest_tokens:
                highest_tokens = c.prompt_tokens
                highest_node = c.name
                
            # Check inputs for raw tavily output
            inputs = c.inputs or {}
            inputs_str = json.dumps(inputs)
            
            if "search-tool" in c.name:
                has_tavily = True
                tavily_output_len = len(str(c.outputs)) if c.outputs else 0
                
            # Check if history is resent and its size
            if "messages" in inputs_str:
                messages = inputs.get("messages", [])
                if isinstance(messages, list):
                    print(f"[{c.name}] Number of messages in input: {len(messages)}")
                    
        print(f"Highest token count: {highest_tokens} in node '{highest_node}'")
        if has_tavily:
            print(f"Tavily tool was called. Output size: {tavily_output_len} chars.")
            
if __name__ == "__main__":
    analyze_traces()
