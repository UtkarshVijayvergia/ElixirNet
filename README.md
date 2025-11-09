## Inspiration
We were interested to take up this project by the challenge of solving real-world problems through logical reasoning and algorithms. Route optimization immediately caught our attention, as it is a cornerstone in industries like ride-sharing, supply chains, and navigation systems—where even small improvements save time and cost. We saw an opportunity to apply what we had learned about algorithms like Dijkstra’s in a hands-on, practical scenario.

At the same time, the challenge of potion flow discrepancies intrigued us. Matching actual potion drained from cauldrons with ticketed records required careful assumptions and calculations. The idea of combining route optimization with anomaly detection, then visualizing it all in an intuitive dashboard, felt like the perfect way to challenge our problem-solving skills while creating something insightful, actionable, and engaging. This project became a playground for logic, creativity, and practical application all in one.

## What it does
ElixirNet is designed to monitor, analyze, and optimize the flow of potions across a network of cauldrons, while ensuring accuracy in potion records and efficiency in courier operations.

*Discrepancy Detection:* The system identifies mismatches between the actual potion drained from each cauldron and the potion recorded on transport tickets. This feature helps catch underreporting, ghost tickets, or over-reporting, ensuring transparency and accountability in potion logistics.

*Courier Route Optimization:* Using real-time cauldron locations and travel times, the dashboard suggests optimal routes for couriers to deliver potions to the market. This reduces travel time, prevents overflows, and ensures timely collection, saving resources and improving operational efficiency.

*Real-Time Cauldron Monitoring:* The dashboard provides minute-by-minute updates on potion levels in each cauldron. This allows managers to anticipate overflows, plan timely collections, and understand the flow patterns unique to each cauldron.

*Visual Insights & Analytics:* Beyond raw numbers, the system visualizes potion discrepancies, courier activities, and under- or over-reporting patterns. It highlights suspicious activity and provides actionable insights, helping decision-makers quickly identify bottlenecks and inefficiencies.

## How we built it
We approached the project in three main parts:

*Detecting inconsistencies between actual and ticketed potion levels -*
To ensure accuracy in potion reporting, we developed a logic that compares two distinct stories: the cauldron’s minute-by-minute level data and the courier’s daily transport tickets. First, the system scans the cauldron data to detect sudden drops in potion levels, identifying these as “drain events” or pickups. It then calculates the true volume collected during each event, accounting for the fact that potion continuously flows into the cauldron even as it’s being drained. This ensures that the drained volume reflects both the starting-to-ending level difference and the potion added during the drain. Finally, the logic cross-checks these values with the daily transport tickets. If the drained amount does not match the ticketed amount, or if a drain occurs without any matching ticket, the system flags it as an inconsistency. This gives a transparent and reliable view of potion collection.

*Dashboard & Visualization -*
Once inconsistencies were identified, we built a dashboard to present this data in an intuitive, actionable way. The dashboard provides:

1. Minute-by-minute potion levels for each cauldron

2. Percentage of ticket discrepancies

3. Highlighting of ghost tickets, over- or under-reporting

4. Visibility of the couriers involved in under-reporting

*Route Optimization for Couriers -*
To ensure timely and efficient potion collection, we incorporated route optimization. By using cauldron locations, travel times, and courier capacity, the system calculates the most optimal path using the minimum number of couriers. This minimizes travel time, decreases costs, prevents overflows, and ensures that potion logistics are both efficient and reliable.

Together, these three components—accurate drain tracking, an insightful dashboard, and optimized courier routes—form a cohesive system that improves both the accuracy and efficiency of potion management across the network.

## Challenges we ran into
*Reconciling different types of data –* One of the biggest challenges was comparing minute-by-minute cauldron data with daily transport tickets. Essentially, we were trying to match timestamp based data to daily totals. Designing a logic that could accurately identify drain events and match them to ticketed amounts required careful thinking and validation.

*Making informed assumptions –* To calculate fill rates, drain rates, and the true volume drained, we had to make reasoned assumptions about potion flow behavior. Ensuring these assumptions were realistic while still enabling accurate detection of inconsistencies was a delicate balance.

*Choosing the right routing algorithm –* With multiple cauldrons and variable travel times, we needed a simple yet reliable algorithm to optimize courier routes. The challenge was finding a method that will find the most optimal and efficient path without sacrificing accuracy and overcomplicating the solution.

## Accomplishments that we're proud of
*Rapid prototyping under time pressure –* We managed to implement all the aspects of the project including the bonus track within 24 hours, demonstrating focus, teamwork, and efficiency.

*Stepping outside our comfort zone –* The project pushed us to explore new concepts, from route optimization to data discrepancy analysis, broadening our problem-solving skills.

*Practical application of algorithms –* We gained hands-on experience applying the shortest-path algorithm in a real-world context, bridging the gap between theoretical learning and practical implementation.

## What we learned
*Bridging theory and practice –* Implementing shortest-path algorithms and discrepancy detection helped us see how theoretical concepts translate to real-world logistics and data integrity challenges.

*Data interpretation is critical –* Comparing timestamped cauldron data with daily ticket data taught us the importance of making informed assumptions and carefully reasoning through “apples-to-oranges” problems.

*Effective visualization matters –* Turning complex data into intuitive dashboards reinforced how crucial clear, user-friendly visualizations are for communicating insights quickly and effectively.

*Iterative problem-solving –* The project highlighted the value of prototyping, testing, and refining solutions in a fast-paced, real-world scenario.

## What's next for ElixirNet
One of our next goals is to make the pathfinding algorithm more efficient. We plan to explore better optimization techniques—like heuristic-based or dynamic routing approaches, to make route planning faster and more scalable.
