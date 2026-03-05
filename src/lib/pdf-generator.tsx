import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";

// Register a clean sans-serif font
Font.register({
  family: "Helvetica",
  fonts: [
    { src: "Helvetica" },
    { src: "Helvetica-Bold", fontWeight: "bold" },
  ],
});

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#1f2937",
    lineHeight: 1.4,
  },
  name: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 4,
  },
  contactLine: {
    fontSize: 9,
    textAlign: "center",
    color: "#6b7280",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "bold",
    textTransform: "uppercase",
    borderBottomWidth: 1,
    borderBottomColor: "#d1d5db",
    paddingBottom: 2,
    marginBottom: 6,
    marginTop: 12,
    letterSpacing: 0.5,
  },
  summary: {
    fontSize: 10,
    marginBottom: 4,
    lineHeight: 1.5,
  },
  experienceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 2,
    marginTop: 8,
  },
  companyTitle: {
    fontSize: 10,
    fontWeight: "bold",
  },
  dates: {
    fontSize: 9,
    color: "#6b7280",
  },
  locationLine: {
    fontSize: 9,
    color: "#6b7280",
    marginBottom: 3,
  },
  bullet: {
    fontSize: 10,
    marginLeft: 12,
    marginBottom: 2,
    lineHeight: 1.4,
  },
  skillsText: {
    fontSize: 10,
    lineHeight: 1.5,
  },
  eduHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  eduSchool: {
    fontSize: 10,
    fontWeight: "bold",
  },
  eduDegree: {
    fontSize: 10,
    color: "#374151",
  },
});

interface ResumeData {
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
  linkedin?: string;
  summary?: string;
  education?: Array<{
    school: string;
    degree: string;
    field?: string;
    gpa?: string;
    dates?: string;
  }>;
  experience?: Array<{
    company: string;
    title: string;
    location?: string;
    dates?: string;
    bullets?: string[];
  }>;
  skills?: string[];
  certifications?: string[];
}

export function generateResumePDF(data: ResumeData) {
  const contactParts = [data.email, data.phone, data.location, data.linkedin].filter(Boolean);

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {/* Name */}
        <Text style={styles.name}>{data.name || "Resume"}</Text>

        {/* Contact Info */}
        {contactParts.length > 0 && (
          <Text style={styles.contactLine}>{contactParts.join(" | ")}</Text>
        )}

        {/* Professional Summary */}
        {data.summary && (
          <View>
            <Text style={styles.sectionTitle}>Professional Summary</Text>
            <Text style={styles.summary}>{data.summary}</Text>
          </View>
        )}

        {/* Education */}
        {data.education && data.education.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>Education</Text>
            {data.education.map((edu, i) => (
              <View key={i}>
                <View style={styles.eduHeader}>
                  <Text style={styles.eduSchool}>{edu.school}</Text>
                  <Text style={styles.dates}>{edu.dates}</Text>
                </View>
                <Text style={styles.eduDegree}>
                  {edu.degree}
                  {edu.field ? ` in ${edu.field}` : ""}
                  {edu.gpa ? ` | GPA: ${edu.gpa}` : ""}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Technical Skills */}
        {data.skills && data.skills.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>Technical Skills</Text>
            <Text style={styles.skillsText}>{data.skills.join(", ")}</Text>
          </View>
        )}

        {/* Professional Experience */}
        {data.experience && data.experience.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>Professional Experience</Text>
            {data.experience.map((exp, i) => (
              <View key={i}>
                <View style={styles.experienceHeader}>
                  <Text style={styles.companyTitle}>
                    {exp.company} | {exp.title}
                  </Text>
                  <Text style={styles.dates}>{exp.dates}</Text>
                </View>
                {exp.location && (
                  <Text style={styles.locationLine}>{exp.location}</Text>
                )}
                {exp.bullets?.map((bullet, j) => (
                  <Text key={j} style={styles.bullet}>
                    {"•  "}
                    {bullet}
                  </Text>
                ))}
              </View>
            ))}
          </View>
        )}

        {/* Certifications */}
        {data.certifications && data.certifications.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>Certifications</Text>
            {data.certifications.map((cert, i) => (
              <Text key={i} style={styles.bullet}>
                {"•  "}
                {cert}
              </Text>
            ))}
          </View>
        )}
      </Page>
    </Document>
  );
}
