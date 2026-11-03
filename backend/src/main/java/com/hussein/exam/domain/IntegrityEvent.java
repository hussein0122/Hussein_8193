package com.hussein.exam.domain;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "integrity_events", indexes = @Index(name = "idx_integrity_attempt", columnList = "attempt_id"))
public class IntegrityEvent {
  @Id @GeneratedValue(strategy = GenerationType.UUID) private UUID id;
  @Column(name="attempt_id", nullable=false) private UUID attemptId;
  @Column(nullable=false, length=40) private String eventType;
  @Column(nullable=false) private Instant occurredAt = Instant.now();
  @Column(nullable=false) private int strikeNumber;
  @Column(nullable=false, length=20) private String status = "CONFIRMED";
  protected IntegrityEvent() {}
  public IntegrityEvent(UUID attemptId, String eventType, int strikeNumber) { this.attemptId=attemptId; this.eventType=eventType; this.strikeNumber=strikeNumber; }
  public UUID getId(){return id;} public UUID getAttemptId(){return attemptId;} public String getEventType(){return eventType;}
  public Instant getOccurredAt(){return occurredAt;} public int getStrikeNumber(){return strikeNumber;} public String getStatus(){return status;}
}
