# Sonanyms

Sonanyms is a basic multi-player synonym guessing game built with Next.js and AWS. Players can go head to head to test their vocabulary skills by trying to guess synonyms for a given word.

The game features real-time multiplayer functionality using aws websocket API Gateway and DynamoDB. I implemented user authentication using clerk so users can save their progress and level up their account.

I architected a pipeline to generate synonym data using the Datamuse API and store it in a DynamoDB table, as well as a real-time matchmaking system that manages queues that players join. There is also a simple admin dashboard where i can add new words and synonyms to the database. 

Full release coming soon!

<img width="827" height="715" alt="image" src="https://github.com/user-attachments/assets/d2f5ec4c-4985-4d89-8689-741f646fc6f3" />
