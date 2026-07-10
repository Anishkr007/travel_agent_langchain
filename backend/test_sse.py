import asyncio
import json
import httpx

async def test():
    async with httpx.AsyncClient(timeout=30.0) as client:
        print("Logging in...")
        resp = await client.post("http://localhost:8000/api/auth/login", data={"username": "test@test.com", "password": "password"})
        token = resp.json()["access_token"]
        print("Token:", token[:10])

        print("Sending chat message...")
        headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
        payload = {"user_id": "test_id", "thread_id": "thread_2", "message": "hello"}
        
        async with client.stream("POST", "http://localhost:8000/api/chat/chat", headers=headers, json=payload) as response:
            print("Status:", response.status_code)
            async for chunk in response.aiter_text():
                print("CHUNK:", repr(chunk))

if __name__ == "__main__":
    asyncio.run(test())
