-- Seed data for MySnippetHub
-- Sample snippets and tags for development

-- Insert sample tags
INSERT OR IGNORE INTO tags (name, color) VALUES 
('JavaScript', '#F7DF1E'),
('React', '#61DAFB'),
('Python', '#3776AB'),
('Node.js', '#339933'),
('CSS', '#1572B6'),
('HTML', '#E34F26'),
('TypeScript', '#3178C6'),
('Rust', '#000000'),
('API', '#FF6B35'),
('Database', '#336791'),
('Utility', '#6B7280'),
('Tutorial', '#8B5CF6');

-- Insert sample snippets
INSERT OR IGNORE INTO snippets (title, content, language, source) VALUES 
('React useState Hook', 'import React, { useState } from ''react'';

function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>You clicked {count} times</p>
      <button onClick={() => setCount(count + 1)}>
        Click me
      </button>
    </div>
  );
}

export default Counter;', 'javascript', 'React Documentation'),

('Python List Comprehension', '# List comprehension examples
squares = [x**2 for x in range(10)]
evens = [x for x in range(20) if x % 2 == 0]

# Nested list comprehension
matrix = [[1, 2, 3], [4, 5, 6], [7, 8, 9]]
flattened = [item for row in matrix for item in row]

print(squares)   # [0, 1, 4, 9, 16, 25, 36, 49, 64, 81]
print(evens)     # [0, 2, 4, 6, 8, 10, 12, 14, 16, 18]
print(flattened) # [1, 2, 3, 4, 5, 6, 7, 8, 9]', 'python', 'Python Tutorial'),

('Express.js Route Handler', 'const express = require(''express'');
const app = express();

// Middleware
app.use(express.json());

// GET route with query parameters
app.get(''/api/users'', (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  
  // Simulate database query
  const users = Array.from({ length: limit }, (_, i) => ({
    id: i + 1 + (page - 1) * limit,
    name: `User ${i + 1}`,
    email: `user${i + 1}@example.com`
  }));
  
  res.json({
    users,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: 100
    }
  });
});

app.listen(3000, () => {
  console.log(''Server running on port 3000'');
});', 'javascript', 'Express.js Documentation'),

('CSS Grid Layout', '.grid-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  grid-gap: 20px;
  padding: 20px;
}

.grid-item {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
  border-radius: 8px;
  color: white;
  transition: transform 0.3s ease;
}

.grid-item:hover {
  transform: translateY(-5px);
}

/* Responsive breakpoints */
@media (max-width: 768px) {
  .grid-container {
    grid-template-columns: 1fr;
    padding: 10px;
  }
}', 'css', 'CSS Grid Guide'),

('Rust Vector Operations', 'fn main() {
    // Create a new vector
    let mut numbers = vec![1, 2, 3, 4, 5];
    
    // Add elements
    numbers.push(6);
    numbers.extend([7, 8, 9]);
    
    // Iterate and transform
    let squares: Vec<i32> = numbers
        .iter()
        .map(|x| x * x)
        .collect();
    
    // Filter even numbers
    let evens: Vec<i32> = numbers
        .iter()
        .filter(|&x| x % 2 == 0)
        .cloned()
        .collect();
    
    println!("Original: {:?}", numbers);
    println!("Squares: {:?}", squares);
    println!("Evens: {:?}", evens);
    
    // Find maximum
    if let Some(max) = numbers.iter().max() {
        println!("Maximum: {}", max);
    }
}', 'rust', 'Rust by Example');

-- Link snippets with tags
INSERT OR IGNORE INTO snippet_tags (snippet_id, tag_id) VALUES 
-- React useState snippet
(1, (SELECT id FROM tags WHERE name = 'JavaScript')),
(1, (SELECT id FROM tags WHERE name = 'React')),
(1, (SELECT id FROM tags WHERE name = 'Tutorial')),

-- Python list comprehension snippet  
(2, (SELECT id FROM tags WHERE name = 'Python')),
(2, (SELECT id FROM tags WHERE name = 'Utility')),
(2, (SELECT id FROM tags WHERE name = 'Tutorial')),

-- Express.js route handler snippet
(3, (SELECT id FROM tags WHERE name = 'JavaScript')),
(3, (SELECT id FROM tags WHERE name = 'Node.js')),
(3, (SELECT id FROM tags WHERE name = 'API')),

-- CSS Grid snippet
(4, (SELECT id FROM tags WHERE name = 'CSS')),
(4, (SELECT id FROM tags WHERE name = 'HTML')),
(4, (SELECT id FROM tags WHERE name = 'Tutorial')),

-- Rust vector operations snippet
(5, (SELECT id FROM tags WHERE name = 'Rust')),
(5, (SELECT id FROM tags WHERE name = 'Utility')),
(5, (SELECT id FROM tags WHERE name = 'Tutorial'));

-- Add some favorites
INSERT OR IGNORE INTO favorites (snippet_id) VALUES (1), (3);