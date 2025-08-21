package com.upload.config;

import com.upload.service.FolderScanner.PartType;
import java.util.Map;

public class PartTypeRegistry { 
	public static final Map<String, PartType> PART_TYPES = Map.ofEntries(
			Map.entry("NOTES", new PartType(12, 1, "LECTURENOTES")),
		    Map.entry("TOPICNOTES", new PartType(12, 1, "LECTURENOTES")),
		    Map.entry("SUMMARY", new PartType(13, 1, "LECTURENOTESSUMMARY")),
		    Map.entry("IA", new PartType(14, 1, "LECTURENOTESINTERNALASSESSMENT")),
		    Map.entry("INTERNALASSESSMENT", new PartType(14, 1, "LECTURENOTESINTERNALASSESSMENT")),
		    Map.entry("LMR", new PartType(8, 1, "QUESTIONANDANSWER")),
		    Map.entry("MID", new PartType(14, 1, "LECTURENOTESINTERNALASSESSMENT")),
		    Map.entry("PYQ", new PartType(6, 0, "EXAM_QP")),
		    Map.entry("SYLLABUS", new PartType(3, 0, "SYLLABUS")),
		    Map.entry("MP", new PartType(6, 0, "EXAM_QP")),
		    Map.entry("MODELPAPERS", new PartType(6, 0, "EXAM_QP")),
		    Map.entry("VIDEOS", new PartType(15, 0, "VIDEOS"))
		);
}
