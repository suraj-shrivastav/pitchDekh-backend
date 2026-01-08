import supabase from "../database/supabase.js";
export const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        // console.log("authHeader: ", authHeader);
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ message: "Unauthorized: Missing or invalid token" });
        }
        const token = authHeader.split(" ")[1];
        const { data, error } = await supabase.auth.getUser(token);
        if (error || !data.user) {
            return res.status(401).json({ message: "Unauthorized: Invalid user session" });
        }
        req.user = data.user;
        next();
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}

export const authAdminMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        // console.log("authHeader: ", authHeader);
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ message: "Unauthorized: Missing or invalid token" });
        }
        const token = authHeader.split(" ")[1];
        const { data, error } = await supabase.auth.getUser(token);
        if (error || !data.user) {
            return res.status(401).json({ message: "Unauthorized: Invalid user session" });
        }

        if (req.user.app_metadata.role !== "admin") {
            return res.status(401).json({ message: "Unauthorized: Invalid user session" });
        }
        console.log("Welcome Back Admin...");
        next();
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}