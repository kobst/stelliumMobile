import React, { useRef, useEffect, useState, useCallback, memo, useMemo } from 'react';


const PUBLIC_BASE = process.env.PUBLIC_URL || '';

const zodiacIcons = [
    `${PUBLIC_BASE}/assets/signs/aries.svg`,
    `${PUBLIC_BASE}/assets/signs/taurus.svg`,
    `${PUBLIC_BASE}/assets/signs/gemini.svg`,
    `${PUBLIC_BASE}/assets/signs/cancer.svg`,
    `${PUBLIC_BASE}/assets/signs/leo.svg`,
    `${PUBLIC_BASE}/assets/signs/virgo.svg`,
    `${PUBLIC_BASE}/assets/signs/libra.svg`,
    `${PUBLIC_BASE}/assets/signs/scorpio.svg`,
    `${PUBLIC_BASE}/assets/signs/sagittarius.svg`,
    `${PUBLIC_BASE}/assets/signs/capricorn.svg`,
    `${PUBLIC_BASE}/assets/signs/aquarius.svg`,
    `${PUBLIC_BASE}/assets/signs/pisces.svg`
];


const planetIcons = [
    `${PUBLIC_BASE}/assets/planets/Sun.svg`,
    `${PUBLIC_BASE}/assets/planets/Moon.svg`,
    `${PUBLIC_BASE}/assets/planets/Mercury.svg`,
    `${PUBLIC_BASE}/assets/planets/Venus.svg`,
    `${PUBLIC_BASE}/assets/planets/Mars.svg`,
    `${PUBLIC_BASE}/assets/planets/Jupiter.svg`,
    `${PUBLIC_BASE}/assets/planets/Saturn.svg`,
    `${PUBLIC_BASE}/assets/planets/Uranus.svg`,
    `${PUBLIC_BASE}/assets/planets/Neptune.svg`,
    `${PUBLIC_BASE}/assets/planets/Pluto.svg`,
    `${PUBLIC_BASE}/assets/planets/Ascendent.svg`
]


const planetNameToIndex = {
    "Sun": 0,
    "Moon": 1,
    "Mercury": 2,
    "Venus": 3,
    "Mars": 4,
    "Jupiter": 5,
    "Saturn": 6,
    "Uranus": 7,
    "Neptune": 8,
    "Pluto": 9,
    "Ascendant": 10,
};

const PLANET_COLORS = {
    Sun: '#FFD700',      // gold
    Moon: '#A9A9A9',     // grey
    Mercury: '#FFA500',  // orange
    Venus: '#ADFF2F',    // greenish
    Mars: '#FF4500',     // red/orange
    Jupiter: '#FF8C00',  // dark orange
    Saturn: '#DAA520',   // goldenrod
    Uranus: '#40E0D0',   // turquoise
    Neptune: '#1E90FF',  // blue
    Pluto: '#8A2BE2',    // purple
    Ascendant: '#FFFFFF', // white for ascendant
};

const hexToRgba = (hex, alpha = 1) => {
    let h = hex.replace('#', '');
    if (h.length === 3) {
        h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    }
    const bigint = parseInt(h, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

// Cache for SVG URLs
const svgCache = new Map();

// Enhanced SVG loader that also recolors stroke attributes and single-quoted attributes,
// while preserving fill='none'
const loadAndModifySVGEnhanced = async (url, color, instanceId) => {
    const cacheKey = `enh-${instanceId}-${url}-${color}`;

    if (svgCache.has(cacheKey)) {
        return svgCache.get(cacheKey);
    }

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch SVG: ${response.status}`);
        }
        const text = await response.text();
        const modifiedSVG = text
            // stroke="..." and stroke='...'
            .replace(/stroke=("|')[^"']*(\1)/g, `stroke='${color}'$2`)
            // inline CSS stroke: ...;
            .replace(/stroke:\s*[^;"']+;/g, `stroke: ${color};`)
            // fill="..." and fill='...' but skip fill='none'
            .replace(/fill=("|')(?!none\1)[^"']*(\1)/g, `fill='${color}'$2`)
            // inline CSS fill: ...; but preserve fill:none
            .replace(/fill:\s*(?!none)[^;"']+;/g, `fill: ${color};`);

        const blob = new Blob([modifiedSVG], { type: 'image/svg+xml' });
        const objectUrl = URL.createObjectURL(blob);
        svgCache.set(cacheKey, objectUrl);
        return objectUrl;
    } catch (error) {
        console.error(`Error loading SVG from ${url}:`, error);
        return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="${color}"/></svg>`;
    }
};

const loadAndModifySVG = async (url, color, instanceId) => {
    const cacheKey = `${instanceId}-${url}-${color}`;
    
    if (svgCache.has(cacheKey)) {
        return svgCache.get(cacheKey);
    }

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch SVG: ${response.status}`);
        }
        const text = await response.text();
        const modifiedSVG = text.replace(/fill="[^"]*"/g, `fill='${color}'`);
        const blob = new Blob([modifiedSVG], { type: 'image/svg+xml' });
        const objectUrl = URL.createObjectURL(blob);
        
        svgCache.set(cacheKey, objectUrl);
        return objectUrl;
    } catch (error) {
        console.error(`Error loading SVG from ${url}:`, error);
        return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="${color}"/></svg>`;
    }
};

const getColorForZodiac = (index) => {
    return 'purple';
  };

// Move constants outside component
const CANVAS_DIMENSIONS = {
    centerX: 300,
    centerY: 300,
    outerRadius: 170,
    innerRadius: 105,
    houseCircleRadius: 180
};

const Ephemeris = memo(({ planets, houses, aspects, transits, ascendantDegree = 0, instanceId }) => {
    const canvasRef = useRef(null);
    
    // Get ascendant degree from houses
    const currentAscendantDegree = useMemo(() => {
        return (houses && houses.length !== 0) ? houses[0].degree : ascendantDegree;
    }, [houses, ascendantDegree]);

    // Memoize the drawing functions
    const drawHouses = useCallback((ctx, houses, houseRotationRadians) => {
        console.log("drawing houses")
        houses.forEach(house => {
            const houseDegree = house.degree;
            const houseRadians = ((270 - houseDegree) % 360) * Math.PI / 180 + houseRotationRadians;
            ctx.beginPath();
            ctx.moveTo(CANVAS_DIMENSIONS.centerX + CANVAS_DIMENSIONS.outerRadius * Math.cos(houseRadians), CANVAS_DIMENSIONS.centerY + CANVAS_DIMENSIONS.outerRadius * Math.sin(houseRadians));
            ctx.lineTo(CANVAS_DIMENSIONS.centerX + CANVAS_DIMENSIONS.houseCircleRadius * Math.cos(houseRadians), CANVAS_DIMENSIONS.centerY + CANVAS_DIMENSIONS.houseCircleRadius * Math.sin(houseRadians));
            if ([1, 10].includes(house.house)) {
                ctx.lineWidth = 6;
            } else {
                ctx.lineWidth = 1;
            }
            ctx.strokeStyle = 'white';
            ctx.stroke();
            ctx.lineWidth = 1;
        });
    }, []); // Empty dependency array since using constant CANVAS_DIMENSIONS

    const drawPlanets = useCallback(async (ctx, planetsToDraw, rotationRadians) => {
        const ICON_WIDTH = 40;
        const ICON_HEIGHT = 40;
        const ICON_DRAW_OFFSET_X = 10; // Original offset for drawImage top-left from anchor
        const ICON_DRAW_OFFSET_Y = 10;
        const BASE_PLANET_ICON_ANCHOR_RADIUS = CANVAS_DIMENSIONS.outerRadius + 50; // Base radius for the icon's anchor point

        // Sort planets by degree to process them in order around the circle
        const sortedPlanets = [...planetsToDraw].sort((a, b) => a.full_degree - b.full_degree);
        
        const planetDrawInfos = []; // Stores info needed for drawing after positions are set
        const occupiedPositions = []; // Stores bounding boxes of already positioned icons

        // Phase 1: Calculate non-overlapping positions
        for (const planet of sortedPlanets) {
            const planetIndex = planetNameToIndex[planet.name];
            if (planetIndex === undefined) continue;

            const planetDegree = planet.full_degree;
            // Calculate the true angular position for the planet, including chart rotation
            const truePlanetRadians = ((270 - planetDegree) % 360) * Math.PI / 180 + rotationRadians;

            let currentIconAnchorRadius = BASE_PLANET_ICON_ANCHOR_RADIUS;
            let adjustedIconTopLeftX, adjustedIconTopLeftY;
            let collisionDetected = true;
            let attempts = 0;
            const MAX_ADJUSTMENT_ATTEMPTS = 10; // Max times to push icon radially outward
            const RADIAL_PUSH_INCREMENT = 15; // How much to push out on each attempt

            while (collisionDetected && attempts < MAX_ADJUSTMENT_ATTEMPTS) {
                const iconAnchorX = CANVAS_DIMENSIONS.centerX + currentIconAnchorRadius * Math.cos(truePlanetRadians);
                const iconAnchorY = CANVAS_DIMENSIONS.centerY + currentIconAnchorRadius * Math.sin(truePlanetRadians);

                adjustedIconTopLeftX = iconAnchorX - ICON_DRAW_OFFSET_X;
                adjustedIconTopLeftY = iconAnchorY - ICON_DRAW_OFFSET_Y;

                collisionDetected = false;
                for (const pos of occupiedPositions) {
                    if (
                        adjustedIconTopLeftX < pos.x + pos.width &&
                        adjustedIconTopLeftX + ICON_WIDTH > pos.x &&
                        adjustedIconTopLeftY < pos.y + pos.height &&
                        adjustedIconTopLeftY + ICON_HEIGHT > pos.y
                    ) {
                        collisionDetected = true;
                        break;
                    }
                }

                if (collisionDetected) {
                    currentIconAnchorRadius += RADIAL_PUSH_INCREMENT;
                    attempts++;
                }
            }

            occupiedPositions.push({
                x: adjustedIconTopLeftX,
                y: adjustedIconTopLeftY,
                width: ICON_WIDTH,
                height: ICON_HEIGHT
            });

            planetDrawInfos.push({
                planetName: planet.name,
                iconUrl: planetIcons[planetIndex],
                drawX: adjustedIconTopLeftX,
                drawY: adjustedIconTopLeftY,
                truePlanetRadians: truePlanetRadians, // Save for drawing hash mark and indicator line
                wasMoved: currentIconAnchorRadius !== BASE_PLANET_ICON_ANCHOR_RADIUS
            });
        }

        // Phase 2: Draw planet icons and their hash marks (and indicator lines if moved)
        for (const info of planetDrawInfos) {
            const { planetName, iconUrl, drawX, drawY, truePlanetRadians, wasMoved } = info;

            const planetColor = PLANET_COLORS[planetName] || 'red';

            // Draw the planet hash mark first (so icon can draw over its end if needed)
            ctx.beginPath();
            ctx.moveTo(CANVAS_DIMENSIONS.centerX + CANVAS_DIMENSIONS.outerRadius * Math.cos(truePlanetRadians), CANVAS_DIMENSIONS.centerY + CANVAS_DIMENSIONS.outerRadius * Math.sin(truePlanetRadians));
            ctx.lineTo(CANVAS_DIMENSIONS.centerX + CANVAS_DIMENSIONS.houseCircleRadius * Math.cos(truePlanetRadians), CANVAS_DIMENSIONS.centerY + CANVAS_DIMENSIONS.houseCircleRadius * Math.sin(truePlanetRadians));
            ctx.strokeStyle = planetColor; // Planet hash mark color
            ctx.stroke();

            // Load and draw the planet icon
            try {
                const coloredIconUrl = await loadAndModifySVGEnhanced(iconUrl, planetColor, instanceId);
                const planetImage = new Image();
                planetImage.src = coloredIconUrl;
                planetImage.onload = () => {
                    ctx.drawImage(planetImage, drawX, drawY, ICON_WIDTH, ICON_HEIGHT);

                    // If the icon was moved, draw an indicator line
                    if (wasMoved) {
                        ctx.beginPath();
                        // Center of the (potentially moved) icon
                        ctx.moveTo(drawX + ICON_WIDTH / 2, drawY + ICON_HEIGHT / 2);
                        // Point on the main outerRadius circle along the planet's true radial line
                        const targetX = CANVAS_DIMENSIONS.centerX + CANVAS_DIMENSIONS.outerRadius * Math.cos(truePlanetRadians);
                        const targetY = CANVAS_DIMENSIONS.centerY + CANVAS_DIMENSIONS.outerRadius * Math.sin(truePlanetRadians);
                        ctx.lineTo(targetX, targetY);
                        ctx.strokeStyle = hexToRgba(planetColor, 0.5); // Faded planet color for indicator
                        ctx.lineWidth = 0.5;
                        ctx.stroke();
                        ctx.lineWidth = 1; // Reset line width
                    }
                };
                planetImage.onerror = () => {
                    console.error(`Error loading image for ${planetName} at ${iconUrl}`);
                    // Fallback drawing for failed image load
                    ctx.fillStyle = planetColor;
                    ctx.fillRect(drawX, drawY, ICON_WIDTH, ICON_HEIGHT);
                    ctx.strokeStyle = 'black';
                    ctx.strokeRect(drawX, drawY, ICON_WIDTH, ICON_HEIGHT);
                };
            } catch (error) {
                console.error(`Error processing SVG for ${planetName}:`, error);
            }
        }
    }, [instanceId]); // Depends only on instanceId as CANVAS_DIMENSIONS is a constant

    const drawAspectLines = useCallback((ctx, aspects, innerRadius, rotationRadians) => {
  
        console.log("Drawing aspects", aspects);
        aspects.forEach(aspect => {
            if (aspect.aspectedPlanet === "South Node"|| aspect.aspectingPlanet === "Chiron"
                || aspect.aspectedPlanet === "Chiron"|| aspect.aspectingPlanet === "South Node"
                || aspect.aspectedPlanet === "Part of Fortune"|| aspect.aspectingPlanet === "Part of Fortune"
            ) {
                return
            }

            const aspectedDegree = aspect.aspectedPlanetDegree;
            const aspectingDegree = aspect.aspectingPlanetDegree;

            const aspectedRadians = ((270 - aspectedDegree) % 360) * Math.PI / 180 + rotationRadians;
            const aspectingRadians  = ((270 - aspectingDegree ) % 360) * Math.PI / 180 + rotationRadians;

            // const transitingRadians = ((270 - transitingDegree) % 360) * Math.PI / 180 + Math.PI/2;
            // const aspectingRadians = ((270 - aspectingDegree) % 360) * Math.PI / 180 + Math.PI/2;

            const startX = CANVAS_DIMENSIONS.centerX + innerRadius * Math.cos(aspectedRadians);
            const startY = CANVAS_DIMENSIONS.centerY + innerRadius * Math.sin(aspectedRadians);
            const endX = CANVAS_DIMENSIONS.centerX + innerRadius * Math.cos(aspectingRadians);
            const endY = CANVAS_DIMENSIONS.centerY + innerRadius * Math.sin(aspectingRadians);

            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(endX, endY);

            // Set line color based on aspect type
            if (aspect.aspectType === 'sextile' || aspect.aspectType === 'trine') {
                ctx.strokeStyle = 'blue';
            } else {
                ctx.strokeStyle = 'red';
            }

            ctx.lineWidth = 1;
            ctx.stroke();
        });
    }, []); // Empty dependency array since using constant CANVAS_DIMENSIONS

    const drawTransits = useCallback((ctx, transits, rotationRadians, houseRotationRadians) => {
        console.log("Drawing transits", transits);
        transits.forEach(planet => {
            const planetIndex = planetNameToIndex[planet.name];
            if (planetIndex !== undefined) {
                const planetDegree = planet.full_degree;
                const planetRadians = ((270 - planetDegree) % 360) * Math.PI / 180 + rotationRadians;
                const planetX = CANVAS_DIMENSIONS.centerX + (CANVAS_DIMENSIONS.outerRadius + 50) * Math.cos(planetRadians) - 25;
                const planetY = CANVAS_DIMENSIONS.centerY + (CANVAS_DIMENSIONS.outerRadius + 50) * Math.sin(planetRadians) - 25;

                // console.log(`Drawing transit for ${planet.name} at (${planetX}, ${planetY})`);

                const planetImage = new Image();
                planetImage.src = planetIcons[planetIndex];
                planetImage.onload = () => {
                    ctx.drawImage(planetImage, planetX, planetY, 50, 50);
                };
                planetImage.onerror = (error) => {
                    console.error(`Error loading image for ${planet.name}:`, error);
                };

                const planetHashRadians = ((270 - planetDegree) % 360) * Math.PI / 180 + houseRotationRadians;
                ctx.beginPath();
                ctx.moveTo(CANVAS_DIMENSIONS.centerX + CANVAS_DIMENSIONS.outerRadius * Math.cos(planetHashRadians), CANVAS_DIMENSIONS.centerY + CANVAS_DIMENSIONS.outerRadius * Math.sin(planetHashRadians));
                ctx.lineTo(CANVAS_DIMENSIONS.centerX + CANVAS_DIMENSIONS.houseCircleRadius * Math.cos(planetHashRadians), CANVAS_DIMENSIONS.centerY + CANVAS_DIMENSIONS.houseCircleRadius * Math.sin(planetHashRadians));
                ctx.strokeStyle = 'blue';
                ctx.stroke();
            }
        });
    }, []); // Empty dependency array since using constant CANVAS_DIMENSIONS


    const drawZodiacWheel = useCallback(async (ctx, planets, houses, aspects, transits) => {

        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        const rotationRadians = ((270 + currentAscendantDegree) % 360) * Math.PI / 180;
        const houseRotationRadians = Math.PI / 180;

        ctx.save();

        ctx.translate(CANVAS_DIMENSIONS.centerX, CANVAS_DIMENSIONS.centerY);
        ctx.rotate(rotationRadians);
        ctx.translate(-CANVAS_DIMENSIONS.centerX, -CANVAS_DIMENSIONS.centerY);

        ctx.strokeStyle = 'white';

        ctx.beginPath();
        ctx.arc(CANVAS_DIMENSIONS.centerX, CANVAS_DIMENSIONS.centerY, CANVAS_DIMENSIONS.outerRadius, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(CANVAS_DIMENSIONS.centerX, CANVAS_DIMENSIONS.centerY, CANVAS_DIMENSIONS.innerRadius, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(CANVAS_DIMENSIONS.centerX, CANVAS_DIMENSIONS.centerY, CANVAS_DIMENSIONS.houseCircleRadius, 0, 2 * Math.PI);
        ctx.stroke();

        for (let i = 0; i < 12; i++) {
            const angle = (i * 30) * Math.PI / 180;
            ctx.beginPath();
            ctx.moveTo(CANVAS_DIMENSIONS.centerX + CANVAS_DIMENSIONS.innerRadius * Math.cos(angle), CANVAS_DIMENSIONS.centerY + CANVAS_DIMENSIONS.innerRadius * Math.sin(angle));
            ctx.lineTo(CANVAS_DIMENSIONS.centerX + CANVAS_DIMENSIONS.outerRadius * Math.cos(angle), CANVAS_DIMENSIONS.centerY + CANVAS_DIMENSIONS.outerRadius * Math.sin(angle));
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        zodiacIcons.forEach(async (iconAddress, index) => {
            const icon = await loadAndModifySVGEnhanced(iconAddress, getColorForZodiac(index), instanceId);
            const iconDegree = 15 + index * 30;
            const iconRadians = ((270 - iconDegree) % 360) * Math.PI / 180 + rotationRadians;
            const iconX = CANVAS_DIMENSIONS.centerX + (CANVAS_DIMENSIONS.innerRadius + 32) * Math.cos(iconRadians) - 25;
            const iconY = CANVAS_DIMENSIONS.centerY + (CANVAS_DIMENSIONS.innerRadius + 32) * Math.sin(iconRadians) - 25;

            const image = new Image();
            image.src = icon;
            image.onload = () => {
                ctx.drawImage(image, iconX, iconY, 50, 50);
            };
        });

        if (planets && planets.length !== 0) {
            drawPlanets(ctx, planets, rotationRadians)
        }

        if (houses && houses.length !== 0) {
            drawHouses(ctx, houses, houseRotationRadians)
        }

        if (aspects && aspects.length !== 0) {
            drawAspectLines(ctx, aspects, CANVAS_DIMENSIONS.innerRadius, houseRotationRadians);
        }

        if (transits && transits.length !== 0) {
            console.log("Calling drawTransits");
            drawTransits(ctx, transits, rotationRadians, houseRotationRadians);
        }

        ctx.restore();
        ctx.strokeStyle = '#000000';
    }, [currentAscendantDegree, drawHouses, drawPlanets, drawAspectLines, drawTransits, instanceId]);

    // Single effect for drawing
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const context = canvas.getContext('2d');
        drawZodiacWheel(context, planets, houses, aspects, transits);
        
        // Cleanup function to release resources
        return () => {
            // Release any cached SVGs when component unmounts
            svgCache.forEach(url => URL.revokeObjectURL(url));
            svgCache.clear();
        };
    }, [planets, houses, aspects, transits, drawZodiacWheel]);

    useEffect(() => {
        console.log('Props changed:', { planets, houses, aspects, transits });
    }, [planets, houses, aspects, transits]);

    
    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <canvas ref={canvasRef} width={600} height={600} />
            <div style={{ width: '800px', display: 'flex', justifyContent: 'center' }}>
                {/* <PlanetPositions planets={planetsArray}/> */}
            </div>
        </div>
    );
});

export default Ephemeris;
