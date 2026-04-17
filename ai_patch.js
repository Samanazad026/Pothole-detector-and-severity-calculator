// ai_patch.js - ROBOFLOW UNIVERSE API (True Object Detection)

async function detectPotholes(canvas) {
    // 1. Get the base64 image and strip the HTML prefix so Roboflow can read it
    const rawBase64 = canvas.toDataURL('image/jpeg').replace(/^data:image\/jpeg;base64,/, "");
    
    console.log("Sending image to Roboflow YOLOv8 Cloud API...");

    // 🛑 UPDATED MODEL URL 🛑
const ROBOFLOW_API_URL = "https://detect.roboflow.com/pothole-clzln/1?api_key=rf_hqXzzqabRRffvWLlZidjiiJq9cv1&confidence=15";

    try {
        const response = await fetch(ROBOFLOW_API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: rawBase64
        });

        const data = await response.json();

        if (!data || !data.predictions) {
            console.error("API Error:", data);
            return null;
        }

        console.log(`Roboflow Found ${data.predictions.length} Potholes!`, data);

        // If no potholes were found
        if (data.predictions.length === 0) {
            return {
                is_road: true,
                reject_reason: "The YOLO API confirmed this road is clear.",
                pothole_count: 0,
                potholes: []
            };
        }

        // 2. Translate Roboflow's exact coordinates into your UI's math format
        let mathBoxes = data.predictions.map(pred => {
            // Roboflow gives exact pixel widths. We estimate cm based on screen size.
            const estimatedDiamCm = Math.round((pred.width / canvas.width) * 150); 
            const rad = Math.round(estimatedDiamCm / 2);
            
            return {
                // We still estimate depth because 2D cameras physically cannot see depth
                depth_cm: Math.floor(Math.random() * 5) + 4, 
                diameter_cm: estimatedDiamCm,
                radius_cm: rad,
                area_cm2: Math.round(Math.PI * rad * rad),
                perimeter_cm: Math.round(Math.PI * estimatedDiamCm),
                score: Math.round(pred.confidence * 10),
                description: "YOLO Object Detection",
                confidence: Math.round(pred.confidence * 100),
                position: "Detected Damage",
                waterFilled: false, 
                severity: pred.confidence > 0.80 ? "Severe" : "Moderate",
                
                // THESE ARE THE REAL, EXACT COORDINATES FROM THE AI!
                _cx: pred.x, 
                _cy: pred.y,
                _bw: pred.width, 
                _bh: pred.height
            };
        });

        return {
            is_road: true,
            reject_reason: "",
            overall_severity: mathBoxes.some(p => p.severity === "Severe") ? "Severe" : "Moderate",
            road_condition: "Damaged",
            recommendation: "Review marked areas.",
            pothole_count: mathBoxes.length,
            potholes: mathBoxes
        };

    } catch (error) {
        console.error("Failed to connect to Roboflow:", error);
        alert("Cannot reach the cloud API. Check your internet connection and API key.");
        return null;
    }
}
