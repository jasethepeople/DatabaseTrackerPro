import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Code, 
  Copy, 
  Check, 
  Sparkles, 
  Star,
  Eye
} from "lucide-react";

// Demo data showing what the code snippet generator produces
const demoSnippets = [
  {
    id: 1,
    title: "Email Validator Function",
    description: "Comprehensive email validation with regex pattern matching and domain checking",
    code: `function validateEmail(email) {
  // Basic format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, error: "Invalid email format" };
  }
  
  // Additional checks
  const [localPart, domain] = email.split('@');
  
  // Check local part length
  if (localPart.length > 64) {
    return { valid: false, error: "Local part too long" };
  }
  
  // Check domain length
  if (domain.length > 253) {
    return { valid: false, error: "Domain too long" };
  }
  
  return { valid: true, email: email.toLowerCase() };
}

// Usage example
const result = validateEmail("user@example.com");
console.log(result); // { valid: true, email: "user@example.com" }`,
    language: "javascript",
    category: "utilities",
    difficulty: "intermediate",
    tags: ["validation", "email", "regex", "utilities"],
    usage: "Use this function to validate email addresses in forms, user registration, or any input validation scenario. Returns an object with validation status and normalized email.",
    rating: 4.8,
    views: 256
  },
  {
    id: 2,
    title: "API Fetch with Error Handling",
    description: "Robust API request function with retry logic, timeout, and comprehensive error handling",
    code: `async function apiRequest(url, options = {}) {
  const defaultOptions = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    timeout: 10000,
    retries: 3,
    ...options
  };
  
  for (let attempt = 1; attempt <= defaultOptions.retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), defaultOptions.timeout);
      
      const response = await fetch(url, {
        ...defaultOptions,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(\`HTTP \${response.status}: \${response.statusText}\`);
      }
      
      return await response.json();
    } catch (error) {
      if (attempt === defaultOptions.retries) {
        throw new Error(\`API request failed after \${defaultOptions.retries} attempts: \${error.message}\`);
      }
      
      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }
}

// Usage example
apiRequest('https://api.example.com/data')
  .then(data => console.log(data))
  .catch(error => console.error('API Error:', error));`,
    language: "javascript",
    category: "web-development",
    difficulty: "advanced",
    tags: ["api", "fetch", "error-handling", "retry", "timeout"],
    usage: "Perfect for making reliable API calls in web applications. Handles network errors, timeouts, and implements retry logic with exponential backoff.",
    rating: 4.9,
    views: 432
  },
  {
    id: 3,
    title: "Binary Search Algorithm",
    description: "Efficient binary search implementation with detailed comments and edge case handling",
    code: `def binary_search(arr, target):
    """
    Performs binary search on a sorted array.
    
    Args:
        arr (list): Sorted array of comparable elements
        target: Element to search for
    
    Returns:
        int: Index of target if found, -1 if not found
    
    Time Complexity: O(log n)
    Space Complexity: O(1)
    """
    left, right = 0, len(arr) - 1
    
    while left <= right:
        # Calculate middle index (prevents overflow)
        mid = left + (right - left) // 2
        
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    
    return -1

# Usage example
sorted_numbers = [1, 3, 5, 7, 9, 11, 13, 15, 17, 19]
index = binary_search(sorted_numbers, 7)
print(f"Found at index: {index}")  # Output: Found at index: 3

# Edge cases
print(binary_search([], 5))      # Returns -1 (empty array)
print(binary_search([1], 1))     # Returns 0 (single element)
print(binary_search([1, 2, 3], 4))  # Returns -1 (not found)`,
    language: "python",
    category: "algorithms",
    difficulty: "intermediate",
    tags: ["binary-search", "algorithms", "sorting", "optimization"],
    usage: "Use for efficient searching in sorted arrays or lists. Perfect for interview preparation or when you need O(log n) search performance.",
    rating: 4.7,
    views: 189
  }
];

export default function DemoCodeSnippets() {
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const handleCopy = async (code: string, id: number) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
            <Sparkles className="w-8 h-8 text-purple-500" />
            Code Snippet Generator Demo
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Examples of AI-generated code snippets with one-click copy functionality
          </p>
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Note:</strong> These are examples of what the code generator produces. 
              To use the full generator, please provide the Anthropic API key when prompted.
            </p>
          </div>
        </div>

        {/* Demo Snippets */}
        <div className="space-y-6">
          {demoSnippets.map((snippet) => (
            <Card key={snippet.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">{snippet.title}</CardTitle>
                    <CardDescription className="mt-2 text-base">{snippet.description}</CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopy(snippet.code, snippet.id)}
                    className="gap-2 shrink-0"
                  >
                    {copiedId === snippet.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copiedId === snippet.id ? "Copied!" : "Copy"}
                  </Button>
                </div>
                <div className="flex gap-2 mt-3">
                  <Badge variant="outline">{snippet.language}</Badge>
                  <Badge variant="outline">{snippet.category}</Badge>
                  <Badge variant="outline">{snippet.difficulty}</Badge>
                  {snippet.tags.slice(0, 2).map((tag) => (
                    <Badge key={tag} variant="secondary">{tag}</Badge>
                  ))}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                    <code>{snippet.code}</code>
                  </pre>
                  
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <h4 className="font-medium mb-2 text-blue-900 dark:text-blue-100">Usage Instructions:</h4>
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      {snippet.usage}
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        {snippet.views} views
                      </span>
                      <span className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500" />
                        {snippet.rating}/5.0
                      </span>
                    </div>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${
                            star <= snippet.rating 
                              ? 'text-yellow-400 fill-current' 
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Feature Highlights */}
        <div className="mt-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="w-5 h-5 text-green-500" />
                Generator Features
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <h4 className="font-semibold mb-2">AI-Powered Generation</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Uses Claude 4.0 to create contextual, production-ready code
                  </p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <h4 className="font-semibold mb-2">Multi-Language Support</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    14 programming languages with proper syntax and conventions
                  </p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <h4 className="font-semibold mb-2">One-Click Copy</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Instant clipboard functionality with visual feedback
                  </p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <h4 className="font-semibold mb-2">Smart Categories</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    12 categories from algorithms to web development
                  </p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <h4 className="font-semibold mb-2">Rating System</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    5-star rating with community feedback and analytics
                  </p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <h4 className="font-semibold mb-2">Usage Instructions</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Clear documentation and implementation guidance
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}