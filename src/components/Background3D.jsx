const Background3D = () => {
    return (
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
            {/* Large mint orb */}
            <div
                className="orb-3d float-animation"
                style={{
                    width: 500,
                    height: 500,
                    top: "-10%",
                    right: "-5%",
                    background:
                        "radial-gradient(circle, hsl(var(--medical-mint)), transparent 70%)",
                }}
            />
            {/* Blue orb */}
            <div
                className="orb-3d float-animation-delayed"
                style={{
                    width: 400,
                    height: 400,
                    bottom: "5%",
                    left: "10%",
                    background:
                        "radial-gradient(circle, hsl(var(--medical-blue)), transparent 70%)",
                }}
            />
            {/* Small warm orb */}
            <div
                className="orb-3d float-animation-slow"
                style={{
                    width: 250,
                    height: 250,
                    top: "40%",
                    right: "25%",
                    background:
                        "radial-gradient(circle, hsl(var(--gradient-hello-from)), transparent 70%)",
                }}
            />
            {/* Subtle grid overlay */}
            <div
                className="absolute inset-0 opacity-[0.02] dark:opacity-[0.04]"
                style={{
                    backgroundImage: `radial-gradient(circle at 1px 1px, hsl(var(--foreground)) 1px, transparent 0)`,
                    backgroundSize: "40px 40px",
                }}
            />
        </div>
    );
};

export default Background3D;
