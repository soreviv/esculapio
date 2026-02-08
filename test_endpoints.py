#!/usr/bin/env python3

import os
import time
import requests
import subprocess
import json
from datetime import datetime

def test_endpoints_with_server():
    """Test various endpoints with a running server"""
    print("🚀 Starting server and testing endpoints...")
    
    # Set environment variables
    env = os.environ.copy()
    env.update({
        'DATABASE_URL': 'postgresql://test:test@localhost:5432/test_db',
        'SESSION_SECRET': 'test-secret-for-basic-testing-very-long-key',
        'NODE_ENV': 'production',
        'PORT': '5000'
    })
    
    server_process = None
    test_results = []
    
    try:
        # Start the server process
        print("Starting server process...")
        server_process = subprocess.Popen(
            ['node', 'dist/index.cjs'],
            cwd='/app',
            env=env,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        
        # Wait for server to start
        time.sleep(4)
        
        if server_process.poll() is not None:
            stdout, stderr = server_process.communicate()
            return [{"test": "Server Startup", "success": False, "error": f"Server failed to start: {stderr[:200]}"}]
        
        print("✅ Server started, testing endpoints...")
        
        # Test cases
        endpoints_to_test = [
            {
                "name": "Root Endpoint",
                "url": "http://localhost:5000/",
                "method": "GET",
                "expected_status": 200,
                "description": "Main application page"
            },
            {
                "name": "Swagger Documentation",
                "url": "http://localhost:5000/api-docs",
                "method": "GET", 
                "expected_status": 200,
                "description": "API documentation interface"
            },
            {
                "name": "Swagger JSON Spec",
                "url": "http://localhost:5000/api-docs.json",
                "method": "GET",
                "expected_status": 200,
                "description": "OpenAPI specification"
            },
            {
                "name": "API Login Endpoint (No Auth)",
                "url": "http://localhost:5000/api/login",
                "method": "POST",
                "expected_status": 400,  # Bad request without credentials
                "description": "Authentication endpoint"
            },
            {
                "name": "API Patients Endpoint (Unauthorized)",
                "url": "http://localhost:5000/api/patients", 
                "method": "GET",
                "expected_status": 401,  # Unauthorized
                "description": "Patient data endpoint"
            }
        ]
        
        for test_case in endpoints_to_test:
            print(f"Testing {test_case['name']}...")
            
            try:
                if test_case["method"] == "GET":
                    response = requests.get(test_case["url"], timeout=10)
                elif test_case["method"] == "POST":
                    response = requests.post(test_case["url"], json={}, timeout=10)
                
                success = response.status_code == test_case["expected_status"]
                
                result = {
                    "test": test_case["name"],
                    "success": success,
                    "expected_status": test_case["expected_status"],
                    "actual_status": response.status_code,
                    "description": test_case["description"],
                    "response_time": response.elapsed.total_seconds(),
                    "response_size": len(response.text)
                }
                
                if success:
                    print(f"  ✅ {test_case['name']}: {response.status_code}")
                    
                    # Special handling for specific endpoints
                    if "swagger" in test_case["name"].lower():
                        if response.text and len(response.text) > 100:
                            result["swagger_content_detected"] = True
                        else:
                            result["swagger_content_detected"] = False
                    
                    if "json" in test_case["url"]:
                        try:
                            json_data = response.json()
                            result["valid_json"] = True
                            if "openapi" in json_data:
                                result["openapi_spec"] = json_data.get("openapi", "unknown")
                        except:
                            result["valid_json"] = False
                            
                else:
                    print(f"  ❌ {test_case['name']}: Expected {test_case['expected_status']}, got {response.status_code}")
                    result["error_details"] = response.text[:200] + "..." if len(response.text) > 200 else response.text
                    
                test_results.append(result)
                
            except Exception as e:
                print(f"  ❌ {test_case['name']}: Error - {e}")
                test_results.append({
                    "test": test_case["name"],
                    "success": False,
                    "error": str(e),
                    "description": test_case["description"]
                })
        
        return test_results
        
    except Exception as e:
        return [{"test": "Server Testing", "success": False, "error": str(e)}]
        
    finally:
        # Clean up
        if server_process and server_process.poll() is None:
            print("Shutting down server...")
            server_process.terminate()
            try:
                server_process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                server_process.kill()

def main():
    print("🧪 MediRecord Server Endpoint Testing")
    print(f"Timestamp: {datetime.now().isoformat()}")
    print("=" * 60)
    
    results = test_endpoints_with_server()
    
    passed_tests = sum(1 for result in results if result.get("success", False))
    total_tests = len(results)
    
    print("\n" + "=" * 60)
    print("📊 Test Results Summary")
    print(f"Tests passed: {passed_tests}/{total_tests}")
    print(f"Success rate: {(passed_tests/total_tests*100):.1f}%")
    
    # Save results
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    results_data = {
        "timestamp": datetime.now().isoformat(),
        "endpoint_tests": results,
        "summary": {
            "passed": passed_tests,
            "total": total_tests,
            "success_rate": f"{(passed_tests/total_tests*100):.1f}%"
        }
    }
    
    results_file = f"/app/test_reports/endpoint_tests_{timestamp}.json"
    with open(results_file, 'w') as f:
        json.dump(results_data, f, indent=2)
    
    print(f"📁 Results saved to: {results_file}")
    
    if passed_tests == total_tests:
        print("🎉 All endpoint tests passed!")
        return True
    else:
        print(f"⚠️  {total_tests - passed_tests} tests failed")
        return False

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)