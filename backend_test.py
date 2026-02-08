import requests
import sys
import os
import time
from datetime import datetime

class MediRecordAPITester:
    def __init__(self, base_url="http://localhost:5000"):
        self.base_url = base_url
        self.session = requests.Session()
        self.tests_run = 0
        self.tests_passed = 0
        self.results = []

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        if headers is None:
            headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = self.session.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = self.session.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PUT':
                response = self.session.put(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = self.session.delete(url, headers=headers, timeout=10)

            success = response.status_code == expected_status
            result = {
                'test': name,
                'method': method,
                'endpoint': endpoint,
                'expected_status': expected_status,
                'actual_status': response.status_code,
                'success': success,
                'response_size': len(response.text),
                'response_time': response.elapsed.total_seconds()
            }

            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                if response.text:
                    try:
                        json_resp = response.json()
                        if isinstance(json_resp, dict) and 'error' not in json_resp:
                            result['response_preview'] = str(json_resp)[:100] + "..." if len(str(json_resp)) > 100 else str(json_resp)
                    except:
                        result['response_preview'] = response.text[:100] + "..." if len(response.text) > 100 else response.text
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}...")
                result['error_response'] = response.text[:500]

            self.results.append(result)
            return success, response

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            result = {
                'test': name,
                'method': method,
                'endpoint': endpoint,
                'expected_status': expected_status,
                'success': False,
                'error': str(e)
            }
            self.results.append(result)
            return False, None

    def test_swagger_docs(self):
        """Test Swagger documentation endpoint"""
        success, response = self.run_test(
            "Swagger UI",
            "GET", 
            "api-docs",
            200
        )
        return success

    def test_swagger_json(self):
        """Test Swagger JSON spec"""
        success, response = self.run_test(
            "Swagger JSON Spec",
            "GET",
            "api-docs.json", 
            200,
            headers={'Accept': 'application/json'}
        )
        return success

    def test_server_health(self):
        """Test basic server connectivity"""
        success, response = self.run_test(
            "Server Health Check",
            "GET",
            "",
            200
        )
        return success

    def test_static_files(self):
        """Test if static files are served"""
        success, response = self.run_test(
            "Static File Serving",
            "GET",
            "assets/index-DDQh_WvO.css",
            200,
            headers={'Accept': 'text/css'}
        )
        return success

    def test_auth_endpoints(self):
        """Test authentication endpoints structure"""
        # Test login endpoint (should return error without credentials)
        success, response = self.run_test(
            "Auth Login Endpoint",
            "POST",
            "api/login",
            400  # Bad request without proper credentials
        )
        
        # Test register endpoint  
        success2, response2 = self.run_test(
            "Auth Register Endpoint",
            "POST", 
            "api/register",
            400  # Bad request without proper data
        )
        
        return success or success2

    def test_api_routes(self):
        """Test API route structure (expecting auth errors)"""
        api_endpoints = [
            ("api/patients", "GET", 401),  # Unauthorized without session
            ("api/notes", "GET", 401),     # Unauthorized without session
            ("api/vitals", "GET", 401),    # Unauthorized without session
        ]
        
        success_count = 0
        for endpoint, method, expected_status in api_endpoints:
            success, response = self.run_test(
                f"API Route {endpoint}",
                method,
                endpoint,
                expected_status
            )
            if success:
                success_count += 1
                
        return success_count > 0

    def print_summary(self):
        """Print test summary"""
        print(f"\n📊 Test Summary")
        print(f"Tests passed: {self.tests_passed}/{self.tests_run}")
        print(f"Success rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        if self.tests_passed < self.tests_run:
            print(f"\n❌ Failed tests:")
            for result in self.results:
                if not result['success']:
                    print(f"  - {result['test']}: {result.get('error', 'Status code mismatch')}")

        return self.tests_passed == self.tests_run

def main():
    print("🚀 Starting MediRecord Backend API Tests...")
    print(f"Timestamp: {datetime.now().isoformat()}")
    
    # Test with localhost since we're testing locally
    tester = MediRecordAPITester("http://localhost:5000")
    
    # Give server time to start up
    print("⏳ Waiting for server to be ready...")
    time.sleep(2)
    
    # Run tests in order of importance
    tests_to_run = [
        ("Server connectivity", tester.test_server_health),
        ("Swagger documentation", tester.test_swagger_docs), 
        ("Swagger JSON spec", tester.test_swagger_json),
        ("Authentication endpoints", tester.test_auth_endpoints),
        ("API routes", tester.test_api_routes),
        ("Static file serving", tester.test_static_files),
    ]
    
    print(f"\n📋 Running {len(tests_to_run)} test categories...")
    
    for test_name, test_func in tests_to_run:
        print(f"\n▶️  {test_name}")
        try:
            test_func()
        except Exception as e:
            print(f"❌ Test category failed: {e}")
    
    # Print results
    success = tester.print_summary()
    
    # Save detailed results
    results_file = f"/app/test_reports/backend_test_results_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"
    with open(results_file, 'w') as f:
        f.write(f"MediRecord Backend Test Results\n")
        f.write(f"Timestamp: {datetime.now().isoformat()}\n")
        f.write(f"Tests passed: {tester.tests_passed}/{tester.tests_run}\n\n")
        
        for result in tester.results:
            f.write(f"Test: {result['test']}\n")
            f.write(f"  Method: {result['method']} {result['endpoint']}\n") 
            f.write(f"  Expected: {result['expected_status']}, Got: {result.get('actual_status', 'N/A')}\n")
            f.write(f"  Success: {result['success']}\n")
            if 'error' in result:
                f.write(f"  Error: {result['error']}\n")
            f.write("\n")
    
    print(f"\n📁 Detailed results saved to: {results_file}")
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())