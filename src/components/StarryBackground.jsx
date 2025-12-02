import React, { useEffect, useRef } from "react";

const StarryBackground = () => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");

        let animationFrameId;
        let stars = [];
        let shootingStars = [];

        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            initStars();
        };

        const initStars = () => {
            stars = [];
            const numStars = Math.floor((canvas.width * canvas.height) / 4000);
            for (let i = 0; i < numStars; i++) {
                stars.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    radius: Math.random() * 1.5,
                    alpha: Math.random(),
                    velocity: Math.random() * 0.05,
                });
            }
        };

        const createShootingStar = () => {
            const startX = Math.random() * canvas.width;
            const startY = Math.random() * canvas.height * 0.5;
            const length = Math.random() * 80 + 10;
            const angle = Math.PI / 4; // 45 degrees
            const speed = Math.random() * 10 + 5;

            shootingStars.push({
                x: startX,
                y: startY,
                length,
                angle,
                speed,
                opacity: 1,
            });
        };

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Draw static stars
            ctx.fillStyle = "white";
            stars.forEach((star) => {
                ctx.globalAlpha = star.alpha;
                ctx.beginPath();
                ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
                ctx.fill();
                star.alpha += star.velocity;
                if (star.alpha > 1 || star.alpha < 0) {
                    star.velocity = -star.velocity;
                }
            });

            // Draw shooting stars
            shootingStars.forEach((star, index) => {
                ctx.globalAlpha = star.opacity;
                ctx.strokeStyle = "white";
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(star.x, star.y);
                ctx.lineTo(
                    star.x - star.length * Math.cos(star.angle),
                    star.y - star.length * Math.sin(star.angle)
                );
                ctx.stroke();

                star.x += star.speed * Math.cos(star.angle);
                star.y += star.speed * Math.sin(star.angle);
                star.opacity -= 0.02;

                if (star.opacity <= 0) {
                    shootingStars.splice(index, 1);
                }
            });

            // Randomly create shooting stars
            if (Math.random() < 0.01) {
                createShootingStar();
            }

            animationFrameId = requestAnimationFrame(draw);
        };

        window.addEventListener("resize", resizeCanvas);
        resizeCanvas();
        draw();

        return () => {
            window.removeEventListener("resize", resizeCanvas);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 z-0 pointer-events-none bg-black"
        />
    );
};

export default StarryBackground;
