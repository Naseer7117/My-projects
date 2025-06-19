package com.upload.config;

import com.upload.service.FolderScanner.PartType;
import java.util.Map;

public class PartTypeRegistry {

    public static final Map<String, PartType> PART_TYPES = Map.of(
        "LMR", new PartType(8, 1, "QUESTIONANDANSWER"),
        "MID", new PartType(14, 1, "LECTURENOTESINTERNALASSESSMENT"),
        "PYQ", new PartType(6, 0, "EXAM_QP"),
        "NOTES", new PartType(12, 1, "LECTURENOTES"),
        "IA", new PartType(14, 1, "LECTURENOTESINTERNALASSESSMENT"),
        "SUMMARY", new PartType(13, 1, "LECTURENOTESSUMMARY"),
        "MODEL PAPER", new PartType(6, 0, "EXAM_QP")
    );
}
