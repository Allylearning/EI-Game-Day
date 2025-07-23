
export const scenarios = [
  { 
    id: 1, 
    minute: 0, 
    text: "The Gaffer just said you’re not in the starting eleven. You really wanted to be out there. You feel annoyed and left out watching from the bench.",
    interaction: "drag-and-drop",
    commentary: "A tough decision for the coach, but your mindset now is key. Staying positive and ready can make all the difference when you get your chance.",
    options: [
      { text: "I'll show them they're wrong when I get on.", value: "I'll show them they're wrong when I get on." },
      { text: "What did I do to deserve this?", value: "What did I do to deserve this?" },
      { text: "I'll support the team and be ready.", value: "I'll support the team and be ready." },
      { text: "I need to train harder to be a starter.", value: "I need to train harder to be a starter." },
      { text: "This is so unfair, the coach has it in for me.", value: "This is so unfair, the coach has it in for me." },
      { text: "Maybe there's a reason, I can learn from this.", value: "Maybe there's a reason, I can learn from this." },
    ]
  },
  { 
    id: 2, 
    minute: 15, 
    text: "Your teammate’s pulled their hammy and you’ve just come on as sub. Right away, you break through the defence and you’re one-on-one with the keeper. You feel the pressure — teammates shouting, crowd yelling.",
    description: "What’s going through your mind in that split second? Do you stay composed, pick your spot, or maybe look for the pass? How do you handle the pressure?",
    interaction: "text",
    commentary: "A big moment so early on!! Whatever the outcome, keeping your cool and making a decisive choice is what counts."
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
        text: "Snap back at them.",
        value: "I shout back at my teammate, telling them to focus on their own game.",
        commentary: "A fiery response! It shows passion, but might create friction in the team. Communication is key, but so is keeping a cool head.",
      },
      {
        icon: "👍",
        text: "Give an understanding thumbs-up.",
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
    commentary: "The dressing room is where leaders are made. Your words and actions now can lift the whole team for the second half – it’s not over yet, remember Liverpool ’05 and United ‘98."
  },
  { 
    id: 5, 
    minute: 60, 
    text: "Your left backs’ been caught ball watching and looks rattled. The ball’s loose and an opponent is pressing hard.",
    description: "What do you do?",
    interaction: "choice",
    timer: 15,
    options: [
        {
            icon: "🗣️",
            text: "Shout encouragement and cover them.",
            value: "I shout 'No worries, I've got it!' and move to cover the immediate danger, reassuring my teammate.",
            commentary: "Excellent teamwork! Supporting your teammate in a tough moment builds trust and strengthens the defensive line.",
        },
        {
            icon: "🏃",
            text: "Sprint to win the ball back yourself.",
            value: "I don’t mess about – I sprint directly at the opponent to try and win the ball back myself.",
            commentary: "That’s real drive! But watch your positioning — if you don’t win it first time, your team could be exposed.",
        },
        {
            icon: "😒",
            text: "Glare at them for their mistake.",
            value: "I give my teammate a frustrated look so they know they messed up, They’ve got to stay switched on.",
            commentary: "Frustration’s natural, but this moment calls for support, not shame. It might shake their confidence even more.",
        },
    ]
  },
  { 
    id: 6, 
    minute: 90+3, 
    text: "The last minutes of the game. In added time, the ball breaks to you on the edge of the box. You could shoot, but a teammate is in a better position. You only have a second to decide.",
    description: "What do you do — and what made you choose that?",
    interaction: "choice",
    timer: 15,
    options: [
      {
        icon: "⚽️",
        text: "Take the shot myself.",
        value: "I take the shot myself, I know I can score a worldie.",
        commentary: "You back yourself to be the hero! It's a high-risk, high-reward play that shows great self-confidence.",
      },
      {
        icon: "🤝",
        text: "Pass to my teammate.",
        value: "I pass to my teammate who’s  ready for a tap-in.",
        commentary: "A smart, selfless decision for the good of the team! Recognising the better option shows great awareness and teamwork – it’s about the three points not individuals.",
      },
    ],
  },
];
