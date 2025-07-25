
'use client';

import Image from 'next/image';
import { Progress } from '@/components/ui/progress';
import { statIcons } from '@/components/icons';
import { getOverallScore, statTitles, getFinalScore } from '@/lib/helpers';
import type { UserData, EqScores, StatName, MatchEvent, QuizResult } from '@/lib/types';
import { cn } from '@/lib/utils';
import React, { useState, useRef } from 'react';

type PlayerCardProps = {
  userData: UserData;
  quizResult: QuizResult;
  className?: string;
};

const StatRow = ({ name, score }: { name: StatName; score: number }) => {
  const Icon = statIcons[name];
  return (
    <div className="flex items-center gap-3">
      <Icon className="w-5 h-5 text-primary/80" />
      <div className="flex-1">
        <div className="flex justify-between items-baseline mb-1">
          <p className="text-sm font-semibold uppercase tracking-wider">{name}</p>
          <p className="font-headline text-lg text-primary font-extrabold">{score}</p>
        </div>
        <Progress value={score} className="h-1.5 bg-white/10" />
      </div>
    </div>
  );
};

const PlayerCard = React.forwardRef<HTMLDivElement, PlayerCardProps>(
  ({ userData, quizResult, className }, ref) => {
    const { eqScores, matchEvents, position, playerComparison } = quizResult;
    const overallScore = getOverallScore(eqScores);
    const stats = Object.entries(eqScores) as [StatName, number][];
    const finalScore = getFinalScore(matchEvents);

    const cardRef = useRef<HTMLDivElement>(null);
    const [cardStyle, setCardStyle] = useState({});
    const [holoStyle, setHoloStyle] = useState({});
    const [isHovering, setIsHovering] = useState(false);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
      if (!cardRef.current) return;
      
      const { clientX, clientY } = e;
      const { left, top, width, height } = cardRef.current.getBoundingClientRect();
      
      const mouseX = (clientX - left) / width;
      const mouseY = (clientY - top) / height;

      const rotateY = (mouseX - 0.5) * 25; // Rotate up to 12.5 degrees
      const rotateX = (0.5 - mouseY) * 25; // Rotate up to 12.5 degrees

      setCardStyle({
        transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.05, 1.05, 1.05)`,
      });

      setHoloStyle({
        backgroundPosition: `${mouseX * 100}% ${mouseY * 100}%`,
        filter: `brightness(1.2) contrast(1.2)`,
        opacity: 0.6
      });
    };

    const handleMouseEnter = () => {
        setIsHovering(true);
    };

    const handleMouseLeave = () => {
        setIsHovering(false);
        setCardStyle({
            transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
        });
        setHoloStyle({
            opacity: 0
        });
    };
    
    const fullName = `${userData.firstName} ${userData.lastName}`;

    return (
      <div ref={ref}>
        <div
          ref={cardRef}
          onMouseMove={handleMouseMove}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          style={cardStyle}
          className={cn(
            'w-full max-w-sm aspect-[10/16] rounded-2xl shadow-2xl shadow-primary/20 relative overflow-hidden font-body text-white transition-transform duration-300 ease-out',
            'transform-style-3d', // Custom utility
            className
          )}
        >
          {/* Selfie Image as full background */}
          <Image
            src={userData.selfie}
            alt={`${fullName}'s player card`}
            layout="fill"
            objectFit="cover"
            style={{ objectPosition: `${userData.selfiePosition.x}% ${userData.selfiePosition.y}%` }}
            data-ai-hint="person soccer"
            className="z-0"
          />
          {/* Holographic effect overlay */}
          <div 
            style={holoStyle}
            className="absolute inset-0 z-10 bg-holo bg-cover opacity-0 transition-opacity duration-300 ease-out"
          ></div>
          {/* Gradient overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-black/30 z-20"></div>
          
          <div className="relative z-30 flex flex-col h-full p-4 transform-style-3d">
            {/* Header */}
            <div className="flex items-start justify-between" style={{ transform: 'translateZ(40px)' }}>
              <div className="text-left">
                <p className="font-headline text-5xl font-extrabold text-primary drop-shadow-lg">{overallScore}</p>
                <p className="uppercase font-semibold tracking-widest text-lg drop-shadow-md">Overall</p>
              </div>
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center border-2 border-primary">
                 <p className="font-headline text-white font-extrabold text-2xl drop-shadow-lg">{position}</p>
              </div>
            </div>
            
            <div className='flex-grow flex flex-col justify-end' style={{ transform: 'translateZ(20px)' }}>
               {/* Name, Title, and Score */}
              <div className="relative z-10 text-center mb-4">
                <h3 className="font-headline text-4xl font-extrabold truncate drop-shadow-lg">{fullName}</h3>
                {playerComparison && playerComparison !== 'None' && (
                  <p className="text-primary font-semibold text-xl drop-shadow-md">{playerComparison}</p>
                )}
                 <div className="flex justify-center items-center gap-4 mt-2 text-2xl font-headline drop-shadow-md font-extrabold">
                    <span className='text-green-400'>{finalScore.goalsFor}</span>
                    <span>-</span>
                    <span className='text-red-400'>{finalScore.goalsAgainst}</span>
                </div>
              </div>
            
              {/* Stats */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                {stats.map(([name, score]) => (
                  <StatRow key={name} name={name} score={score} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);
PlayerCard.displayName = "PlayerCard";

export default PlayerCard;
