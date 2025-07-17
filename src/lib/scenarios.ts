
export const scenarios = [
  { 
    id: 1, 
    minute: 0, 
    text: "You’re not in the starting lineup. You really wanted to be out there. You feel annoyed and left out watching from the sidelines.",
    description: "Drag your two primary thoughts into the box.",
    interaction: "drag-and-drop",
    commentary: "A tough decision for the coach, but your mindset now is key. Staying positive and ready can make all the difference when you get your chance.",
    options: [
      "I'll show them they're wrong when I get on.",
      "What did I do to deserve this?",
      "I'll support the team and be ready.",
      "I need to train harder to be a starter.",
      "This is so unfair, the coach has it in for me.",
      "Maybe there's a reason, I can learn from this.",
    ]
  },
  { 
    id: 2, 
    minute: 15, 
    text: "You’ve just come on as a sub and break through the defence. You’re one-on-one with the keeper. You feel the pressure — teammates shouting, crowd yelling.",
    description: "What’s going through your head, and how do you handle this moment?",
    interaction: "text",
  },
  { 
    id: 3, 
    minute: 30, 
    text: "After you lose the ball, a teammate shouts at you. You feel a flash of anger and embarrassment.",
    description: "What's your immediate reaction?",
    interaction: "choice",
    timer: 15,
    options: [
      {
        icon: "😡",
        text: "Shout back at them.",
        value: "I shout back at my teammate, telling them to focus on their own game.",
        commentary: "A fiery response! It shows passion, but might create friction in the team. Communication is key, but so is keeping a cool head.",
      },
      {
        icon: "👍",
        text: "Give a thumbs-up.",
        value: "I give them a quick thumbs-up to acknowledge the feedback and refocus on the game.",
        commentary: "Great composure. Acknowledging the feedback without escalating shows maturity and keeps the team's focus on the game.",
      },
      {
        icon: "🤫",
        text: "Ignore them and play on.",
        value: "I ignore them completely and just focus on getting back into position.",
        commentary: "Playing on shows focus, but ignoring a teammate could be seen as dismissive. It's a fine line between concentration and communication.",
      }
    ],
  },
  { 
    id: 4, 
    minute: 45, 
    text: "The opposition scored just before halftime. The dressing room is silent and tense.",
    description: "What do you say or do?",
    interaction: "text",
    isMandatoryConcede: true,
  },
  { 
    id: 5, 
    minute: 60, 
    text: "A defender on your team just made a mistake and looks panicked. The ball’s loose and an opponent is charging in.",
    description: "What do you do?",
    interaction: "choice",
    timer: 15,
    options: [
        {
            icon: "🗣️",
            text: "Shout encouragement and cover them.",
            value: "I shout 'Don't worry, I've got you!' and move to cover the immediate danger, reassuring my teammate.",
            commentary: "Excellent teamwork! Supporting your teammate in a tough moment builds trust and strengthens the defensive line.",
        },
        {
            icon: "🏃",
            text: "Sprint to win the ball back yourself.",
            value: "I ignore my teammate and sprint directly at the opponent to try and win the ball back myself.",
            commentary: "A burst of individual effort! It shows determination, but could leave you out of position if you don't win the ball.",
        },
        {
            icon: "😒",
            text: "Glare at them for their mistake.",
            value: "I give my teammate a frustrated look so they know they messed up, hoping they don't do it again.",
            commentary: "A moment of visible frustration. While understandable, it can lower a teammate's confidence when they need support the most.",
        },
    ]
  },
  { 
    id: 6, 
    minute: 90, 
    text: "The game is level. In the last minute, the ball comes to you. You could shoot, but a teammate is in a better position. You only have a second to decide.",
    description: "What do you do — and what made you choose that?",
    interaction: "choice",
    timer: 15,
    options: [
      {
        icon: "⚽️",
        text: "Take the shot myself.",
        value: "I take the shot myself, confident I can score.",
        commentary: "You back yourself to be the hero! It's a high-risk, high-reward play that shows great self-confidence.",
      },
      {
        icon: "🤝",
        text: "Pass to my teammate.",
        value: "I pass to my teammate who is in a better position to score.",
        commentary: "A selfless decision for the good of the team! Recognizing the better option shows great awareness and teamwork.",
      },
    ],
  },
];
