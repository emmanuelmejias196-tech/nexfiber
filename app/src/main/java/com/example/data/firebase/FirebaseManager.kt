package com.example.data.firebase

import android.content.Context
import android.util.Log
import com.example.data.model.Ticket
import com.google.firebase.FirebaseApp
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import kotlinx.coroutines.tasks.await

class FirebaseManager(private val context: Context) {
    private var isFirebaseAvailable = false
    private var auth: FirebaseAuth? = null
    private var firestore: FirebaseFirestore? = null

    init {
        try {
            val app = if (FirebaseApp.getApps(context).isEmpty()) {
                FirebaseApp.initializeApp(context)
            } else {
                FirebaseApp.getInstance()
            }
            if (app != null) {
                auth = FirebaseAuth.getInstance()
                firestore = FirebaseFirestore.getInstance()
                isFirebaseAvailable = true
                Log.d("FirebaseManager", "Firebase successfully initialized")
            }
        } catch (e: Exception) {
            Log.w("FirebaseManager", "Firebase not initialized: ${e.message}")
            isFirebaseAvailable = false
        }
    }

    fun isAvailable(): Boolean = isFirebaseAvailable

    fun getCurrentUser() = auth?.currentUser

    suspend fun syncTicketToFirestore(ticket: Ticket): Boolean {
        if (!isFirebaseAvailable || firestore == null) return false
        return try {
            val ticketMap = hashMapOf(
                "id" to ticket.id,
                "cedula" to ticket.cedula,
                "tipo" to ticket.tipo,
                "categoria" to ticket.categoria,
                "detalle" to ticket.detalle,
                "fecha" to ticket.fecha,
                "estado" to ticket.estado,
                "notaTecnica" to ticket.notaTecnica
            )
            firestore?.collection("reportes_fallas")
                ?.document(ticket.id)
                ?.set(ticketMap)
                ?.await()
            true
        } catch (e: Exception) {
            Log.w("FirebaseManager", "Firestore sync skipped: ${e.message}")
            false
        }
    }
}
