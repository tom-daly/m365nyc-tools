import { useState, useEffect, useMemo } from 'react'
import speakers from '../speakers.json'
import './SpeakerWall.css'

function SpeakerWall() {
  // Create combined array of speakers and city images (memoized to prevent re-generation)
  const gridItems = useMemo(() => {
    const cityImages = ['47.png', '48.jpg', '49.png', '50.png', '51.png', '52.png'];
    const items = [...speakers];
    
    // Shuffle city images array to get random selection
    const shuffledCityImages = [...cityImages].sort(() => Math.random() - 0.5);
    
    // Insert each unique city image once
    const totalCityImages = Math.min(cityImages.length, Math.floor(speakers.length / 7));
    
    for (let i = 0; i < totalCityImages; i++) {
      const cityImage = shuffledCityImages[i]; // Use each image only once
      const randomIndex = Math.floor(Math.random() * items.length);
      items.splice(randomIndex, 0, { type: 'city', image: cityImage });
    }
    
    return items;
  }, []);

  return (
    <div className="speaker-wall">
      <div className="grid">
        {gridItems.map((item, index) => {
          const isCity = item.type === 'city';
          const imageSrc = isCity ? `/images/${item.image}` : `/images/${speakers.indexOf(item) + 1}.jpg`;
          const altText = isCity ? 'City view' : item.fullName;
          
          return (
            <div
              key={index}
              className="speaker-item"
            >
              <img
                src={imageSrc}
                alt={altText}
                className="speaker-image"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
              <div className="speaker-placeholder" style={{display: 'none'}}>
                {!isCity && item.fullName.split(' ').map(name => name[0]).join('')}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  )
}

export default SpeakerWall