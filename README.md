# Notion Workspace Visualizer

A powerful analytics and visualization tool for Notion workspaces that provides insights, metrics, and interactive visualizations to help optimize your workspace organization.

## 🚀 Features

### 1. Interactive Workspace Visualization
- **Force-Directed Graph**: Dynamic visualization of your workspace structure
- **Node Types**: 
  - Workspace (Purple)
  - Databases (Green)
  - Pages (Blue)
  - Child Pages (Light Blue)
- **Interactive Controls**:
  - Zoom in/out
  - Pan across the visualization
  - Drag nodes to reorganize
  - Click nodes to visit pages
- **Expected Results**: Clear visual representation of workspace hierarchy and connections

### 2. Advanced Search & Filtering
- **Real-time Search**: 
  - Instantly find pages by title
  - Highlights matching nodes
  - Updates graph in real-time
- **Smart Filters**:
  - Content Type (Pages, Databases, Templates)
  - Activity Level (Recent, Active, Stale)
  - Page Depth (Root, Shallow, Deep)
  - Connection Count (None, Few, Many)
- **Expected Results**: Quickly locate and focus on specific content areas

### 3. Workspace Analytics
- **Key Metrics**:
  - Workspace Score (0-100)
  - Total Pages Count
  - Active Pages (Last 30 days)
  - Maximum Depth
  - Total Connections
- **Activity Analysis**:
  - Page edit tracking
  - Peak activity times
  - Content growth monitoring
- **Expected Results**: Quantitative insights into workspace health and usage patterns

### 4. AI-Powered Insights
- **Structural Analysis**:
  - Organization patterns
  - Bottleneck identification
  - Improvement suggestions
- **Growth Predictions**:
  - Content growth trends
  - Scaling recommendations
  - Usage pattern analysis
- **Expected Results**: AI-generated recommendations for workspace optimization

### 5. Performance Metrics
- **Structure Metrics**:
  - Page depth distribution
  - Root pages count
  - Connection patterns
- **Activity Metrics**:
  - 7-day activity
  - 30-day activity
  - Inactive pages (90+ days)
- **Expected Results**: Detailed performance analysis of workspace organization

## 🛠 Technical Implementation

### Core Technologies
- **Frontend**: HTML5, CSS3 (Tailwind CSS), JavaScript (ES6+)
- **Backend**: Node.js, Express.js
- **Visualization**: D3.js
- **AI/ML**: OpenAI GPT-4, TensorFlow.js
- **Authentication**: OAuth 2.0 with Notion API

### Key Components

#### 1. Graph Generation (`generateGraph.js`) 