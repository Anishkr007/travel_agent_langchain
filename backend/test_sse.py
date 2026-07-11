import asyncio
import json
import httpx

async def test():
    async with httpx.AsyncClient(timeout=30.0) as client:
        print("Logging in...")
        resp = await client.post("http://localhost:8000/api/auth/login", data={"username": "test@test.com", "password": "password"})
        if resp.status_code != 200:
            print("Login failed, please check test user.", resp.text)
            return
            
        token = resp.json()["access_token"]
        print("Token:", token[:10])
        headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
        
        queries = [
            "flights from Dhaka to Dubai"
        ]
        
        for q in queries:
            print(f"\nSending: {q}")
            payload = {"user_id": "test_id", "thread_id": "thread_langsmith_test", "message": q}
            
            async with client.stream("POST", "http://localhost:8000/api/chat/chat", headers=headers, json=payload) as response:
                print("Status:", response.status_code)
                async for chunk in response.aiter_text():
                    pass # We just consume it to let the backend run the graph
            print("Finished query:", q)

if __name__ == "__main__":
    asyncio.run(test())
