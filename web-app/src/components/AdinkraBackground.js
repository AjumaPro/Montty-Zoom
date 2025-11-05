import React from 'react';
import './AdinkraBackground.css';

const AdinkraBackground = () => {
  return (
    <div className="adinkra-background">
      <svg className="adinkra-pattern" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" preserveAspectRatio="xMidYMid slice">
        <defs>
          <pattern id="adinkra-pattern" x="0" y="0" width="200" height="200" patternUnits="userSpaceOnUse" patternContentUnits="userSpaceOnUse">
            {/* Gye Nyame - "Except for God" - Symbol of supremacy of God */}
            <g transform="translate(50, 50)">
              <circle cx="0" cy="0" r="15" fill="none" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="2"/>
              <circle cx="0" cy="0" r="8" fill="none" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="1.5"/>
              <path d="M 0,-15 Q 8,-8 15,0 Q 8,8 0,15 Q -8,8 -15,0 Q -8,-8 0,-15" 
                    fill="none" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="2"/>
            </g>
            
            {/* Sankofa - "Go back and get it" - Learning from the past */}
            <g transform="translate(150, 50)">
              <path d="M 0,0 Q -15,-15 -30,0 Q -15,15 0,0" 
                    fill="none" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="2"/>
              <path d="M -30,0 L -40,-10" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="2" strokeLinecap="round"/>
            </g>
            
            {/* Akoma - "Heart" - Patience and tolerance */}
            <g transform="translate(50, 150)">
              <path d="M 0,10 Q -12,0 -12,-12 Q 0,-18 12,-12 Q 18,0 12,10 Q 0,18 0,10" 
                    fill="none" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="2"/>
            </g>
            
            {/* Adinkrahene - "Chief of Adinkra symbols" - Greatness and charisma */}
            <g transform="translate(150, 150)">
              <circle cx="0" cy="0" r="18" fill="none" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="2"/>
              <circle cx="0" cy="0" r="10" fill="none" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="1.5"/>
              <circle cx="0" cy="0" r="5" fill="none" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="1.5"/>
            </g>
            
            {/* Dwennimmen - "Ram's horns" - Strength and humility */}
            <g transform="translate(25, 100)">
              <path d="M 0,0 Q -8,-12 -15,-25 Q -10,-20 -5,-15" 
                    fill="none" stroke="rgba(255, 255, 255, 0.12)" strokeWidth="2" strokeLinecap="round"/>
              <path d="M 0,0 Q 8,-12 15,-25 Q 10,-20 5,-15" 
                    fill="none" stroke="rgba(255, 255, 255, 0.12)" strokeWidth="2" strokeLinecap="round"/>
            </g>
            
            {/* Fihankra - "House/Compound" - Security and safety */}
            <g transform="translate(175, 100)">
              <rect x="-12" y="-8" width="24" height="16" 
                    fill="none" stroke="rgba(255, 255, 255, 0.12)" strokeWidth="2"/>
              <path d="M -12,-8 L 0,-20 L 12,-8" 
                    fill="none" stroke="rgba(255, 255, 255, 0.12)" strokeWidth="2"/>
            </g>
            
            {/* Nsoromma - "Star" - Guardianship */}
            <g transform="translate(100, 25)">
              <path d="M 0,-12 L 4,4 L -12,-2 L 12,-2 L -4,4 Z" 
                    fill="none" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="2"/>
            </g>
            
            {/* Mpatapo - "Knot of pacification/reconciliation" - Peace and reconciliation */}
            <g transform="translate(100, 175)">
              <path d="M -10,-10 Q 0,-5 10,-10 Q 5,0 10,10 Q 0,5 -10,10 Q -5,0 -10,-10" 
                    fill="none" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="2"/>
            </g>
            
            {/* Osram Ne Nsoromma - "Moon and Star" - Love and harmony */}
            <g transform="translate(25, 25)">
              <circle cx="0" cy="0" r="8" fill="none" stroke="rgba(255, 255, 255, 0.12)" strokeWidth="1.5"/>
              <path d="M 0,-15 Q 4,-17 8,-15 Q 4,-13 0,-15" 
                    fill="none" stroke="rgba(255, 255, 255, 0.12)" strokeWidth="1.5"/>
            </g>
            
            {/* Nyame Biribi Wo Soro - "God is in the heavens" - Hope */}
            <g transform="translate(175, 25)">
              <path d="M 0,-15 L 0,15 M -15,0 L 15,0" 
                    stroke="rgba(255, 255, 255, 0.12)" strokeWidth="2"/>
              <circle cx="0" cy="0" r="15" fill="none" stroke="rgba(255, 255, 255, 0.12)" strokeWidth="2"/>
            </g>
            
            {/* Epa - "Handcuffs" - Law and justice */}
            <g transform="translate(175, 175)">
              <ellipse cx="0" cy="0" rx="15" ry="8" 
                       fill="none" stroke="rgba(255, 255, 255, 0.12)" strokeWidth="2"/>
              <ellipse cx="0" cy="0" rx="8" ry="15" 
                       fill="none" stroke="rgba(255, 255, 255, 0.12)" strokeWidth="2"/>
            </g>
            
            {/* Denkyem - "Crocodile" - Adaptability */}
            <g transform="translate(100, 100)">
              <ellipse cx="0" cy="0" rx="20" ry="8" 
                       fill="none" stroke="rgba(255, 255, 255, 0.1)" strokeWidth="2"/>
              <path d="M -15,-5 Q -20,-8 -15,-10" 
                    fill="none" stroke="rgba(255, 255, 255, 0.1)" strokeWidth="2"/>
              <path d="M 15,-5 Q 20,-8 15,-10" 
                    fill="none" stroke="rgba(255, 255, 255, 0.1)" strokeWidth="2"/>
            </g>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#adinkra-pattern)"/>
      </svg>
    </div>
  );
};

export default AdinkraBackground;
