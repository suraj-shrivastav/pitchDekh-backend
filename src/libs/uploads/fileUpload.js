// import supabase from "../../database/supabase.js"

// export const uploadFile = async (file) => {
//     console.log("file hit...")
//     console.log(file);
//     const { error } = await supabase.storage
//         .from("user_pitch_decks")
//         .upload(file.originalname, file.buffer, {
//             contentType: file.mimetype,
//             upsert: true,
//         });

//     if (error) throw error;

//     return { success: true };

// }

// export const getFileUrl = async (file) => {
//     const { data, error } = await supabase.storage.from("user_pitch_decks").getPublicUrl(file)
//     if (error) {
//         throw error
//     }
//     return data
// }

import multer from "multer";

const upload = multer({
    storage: multer.diskStorage({
        destination: "uploads/",
        filename: (req, file, cb) => {
            cb(null, `${Date.now()}-${file.originalname}`);
        }
    })
});

export default upload;
