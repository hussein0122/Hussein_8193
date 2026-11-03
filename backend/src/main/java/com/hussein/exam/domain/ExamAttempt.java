package com.hussein.exam.domain;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name="exam_attempts")
public class ExamAttempt {
  @Id @GeneratedValue(strategy=GenerationType.UUID) private UUID id;
  @Column(nullable=false) private UUID studentId;
  @Column(nullable=false) private UUID examId;
  @Column(nullable=false) private int strikes=0;
  @Column(nullable=false,length=20) private String status="IN_PROGRESS";
  private Instant lockedAt;
  @Column(length=120) private String lockReason;
  @Version private long version;
  protected ExamAttempt() {}
  public ExamAttempt(UUID studentId, UUID examId){this.studentId=studentId;this.examId=examId;}
  public UUID getId(){return id;} public UUID getStudentId(){return studentId;} public UUID getExamId(){return examId;}
  public int getStrikes(){return strikes;} public String getStatus(){return status;} public Instant getLockedAt(){return lockedAt;}
  public void registerStrike(){if(!"IN_PROGRESS".equals(status)) throw new IllegalStateException("Attempt is not active"); strikes++; if(strikes>=3){status="LOCKED";lockedAt=Instant.now();lockReason="THREE_INTEGRITY_VIOLATIONS";}}
}
