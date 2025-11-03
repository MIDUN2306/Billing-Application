# Requirements Document

## Introduction

This specification defines the requirements for converting the Profit/Loss chart from a simple horizontal bar chart to a proper combo chart (combination of vertical bars and line graph) to better visualize daily profit/loss trends over time.

## Glossary

- **Combo Chart**: A chart type that combines bars and lines to show both individual values and trends
- **Profit/Loss Data**: Daily financial data showing sales, costs, and resulting profit or loss
- **Data Point**: A single day's profit/loss value
- **Trend Line**: A line connecting all data points to show the overall trend
- **Zero Line**: A horizontal reference line at y=0 separating profit from loss

## Requirements

### Requirement 1: Chart Type Conversion

**User Story:** As a business owner, I want to see daily profit/loss as vertical bars with a trend line, so that I can understand both individual day performance and overall trends.

#### Acceptance Criteria

1. THE System SHALL display profit/loss data as vertical bars on a chart
2. THE System SHALL overlay a line graph connecting all data points
3. WHEN a day has profit, THE System SHALL display a green bar above the zero line
4. WHEN a day has loss, THE System SHALL display a red bar below the zero line
5. THE System SHALL display a horizontal zero line as a reference point

### Requirement 2: Visual Design

**User Story:** As a user, I want the chart to be visually clear and professional, so that I can quickly interpret the data.

#### Acceptance Criteria

1. THE System SHALL use green color (#10b981) for profit bars
2. THE System SHALL use red color (#ef4444) for loss bars
3. THE System SHALL display a continuous line connecting all data points
4. THE System SHALL show date labels on the x-axis
5. THE System SHALL show currency values on the y-axis
6. THE System SHALL display grid lines for easier value reading

### Requirement 3: Interactivity

**User Story:** As a user, I want to interact with the chart to see detailed information, so that I can analyze specific days.

#### Acceptance Criteria

1. WHEN user hovers over a bar, THE System SHALL display a tooltip with date, sales, costs, and profit/loss
2. WHEN user hovers over a line point, THE System SHALL highlight that data point
3. THE System SHALL show smooth transitions when data changes
4. THE System SHALL maintain hover states for better user experience

### Requirement 4: Responsive Design

**User Story:** As a user on different devices, I want the chart to display properly on all screen sizes, so that I can view it anywhere.

#### Acceptance Criteria

1. THE System SHALL adjust chart dimensions based on screen width
2. WHEN screen width is less than 768px, THE System SHALL use mobile-optimized dimensions
3. WHEN screen width is between 768px and 1200px, THE System SHALL use tablet-optimized dimensions
4. WHEN screen width is greater than 1200px, THE System SHALL use desktop-optimized dimensions
5. THE System SHALL maintain readability of labels on all screen sizes

### Requirement 5: Summary Statistics

**User Story:** As a business owner, I want to see summary statistics below the chart, so that I can quickly understand the overall performance.

#### Acceptance Criteria

1. THE System SHALL display count of profit days with total profit amount
2. THE System SHALL display count of loss days with total loss amount
3. THE System SHALL display count of break-even days
4. THE System SHALL display net total (overall profit/loss) for the period
5. THE System SHALL use color coding (green for profit, red for loss) in statistics
