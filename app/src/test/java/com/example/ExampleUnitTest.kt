package com.example

import org.junit.Assert.*
import org.junit.Test

/**
 * Example local unit test, which will execute on the development machine (host).
 *
 * See [testing documentation](http://d.android.com/tools/testing).
 */
class ExampleUnitTest {
  @Test
  fun addition_isCorrect() {
    assertEquals(4, 2 + 2)
  }

  @Test
  fun incidentLifecycle_stepIndicesAreOrdered() {
    val steps = com.example.data.model.IncidentStatus.values().map { it.stepIndex }
    assertEquals(listOf(1, 2, 3, 4, 5, 6, 7), steps)
  }

  @Test
  fun incidentSeverity_weightsAreAccurate() {
    assertTrue(com.example.data.model.Severity.CRITICAL.weight > com.example.data.model.Severity.HIGH.weight)
    assertTrue(com.example.data.model.Severity.HIGH.weight > com.example.data.model.Severity.MEDIUM.weight)
  }
}
