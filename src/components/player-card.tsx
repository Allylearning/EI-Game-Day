
'use client';

import Image from 'next/image';
import { getFinalScore } from '@/lib/helpers';
import type { UserData, QuizResult, EqScores } from '@/lib/types';
import { cn } from '@/lib/utils';
import React, { useState, useRef } from 'react';
import { getOverallScore, statAbbreviations } from '@/lib/helpers';

type PlayerCardProps = {
  userData: UserData;
  quizResult: QuizResult;
  className?: string;
};

const PlayerCard = React.forwardRef<HTMLDivElement, PlayerCardProps>(
  ({ userData, quizResult, className }, ref) => {
    const { eqScores } = quizResult;
    const finalScore = getFinalScore(quizResult.matchEvents);
    const overallScore = getOverallScore(eqScores);
    const scores = eqScores as EqScores;

    const cardRef = useRef<HTMLDivElement>(null);
    const [cardStyle, setCardStyle] = useState({});
    const [holoStyle, setHoloStyle] = useState({});

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

    const handleMouseLeave = () => {
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
          onMouseLeave={handleMouseLeave}
          style={cardStyle}
          className={cn(
            'w-full aspect-[10/16] rounded-2xl shadow-2xl shadow-primary/20 relative overflow-hidden font-body text-white transition-transform duration-300 ease-out z-[10000]',
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
                <p className="font-headline text-3xl font-extrabold text-primary drop-shadow-lg">{finalScore.goalsFor}-{finalScore.goalsAgainst}</p>
                <p className="uppercase font-semibold tracking-widest text-xs drop-shadow-md">Final Score</p>
              </div>
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center border-2 border-primary">
                 <p className="font-headline text-white font-extrabold text-3xl drop-shadow-lg">{overallScore}</p>
              </div>
            </div>
            
            {/* Spacer to push content to the bottom */}
            <div className="flex-grow"></div>

            <div className='flex flex-col justify-end' style={{ transform: 'translateZ(20px)' }}>
               {/* Name & Title */}
              <div className="relative z-10 text-center mb-4">
                <h3 className="font-headline text-5xl font-extrabold truncate drop-shadow-lg">{fullName}</h3>
                <p className="text-primary font-semibold text-xl drop-shadow-md">{userData.club}</p>
              </div>

              {/* Stats Block */}
               <div className="grid grid-cols-3 gap-2 text-center">
                {(Object.keys(scores) as (keyof EqScores)[]).map(stat => (
                  <div key={stat} className="bg-black/40 rounded-lg p-2 backdrop-blur-sm border border-white/10">
                    <p className="font-headline text-3xl font-bold text-primary">{scores[stat]}</p>
                    <p className="font-semibold text-sm tracking-wider">{statAbbreviations[stat]}</p>
                  </div>
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
