// WebSocket service for managing real-time location tracking
export class WebSocketService {
  private static io: any;

  static initialize(io: any) {
    this.io = io;
  }

  // Broadcast location update to inspection room
  static broadcastLocationUpdate(inspectionId: string, locationData: any, excludeSocketId?: string) {
    if (this.io) {
      this.io.to(`inspection-${inspectionId}`).except(excludeSocketId).emit('location-updated', locationData);
    }
  }

  // Broadcast inspection status change
  static broadcastInspectionStatus(inspectionId: string, statusData: any, excludeSocketId?: string) {
    if (this.io) {
      this.io.to(`inspection-${inspectionId}`).except(excludeSocketId).emit('inspection-status-updated', statusData);
    }
  }

  // Send notification to specific user
  static notifyUser(userId: string, event: string, data: any) {
    if (this.io) {
      this.io.to(`user-${userId}`).emit(event, data);
    }
  }

  // Send notification to organization
  static notifyOrganization(organizationId: string, event: string, data: any) {
    if (this.io) {
      this.io.to(`org-${organizationId}`).emit(event, data);
    }
  }

  // Check if user is connected to WebSocket
  static isUserConnected(userId: string): boolean {
    if (this.io) {
      const sockets = this.io.sockets.sockets;
      for (const [socketId, socket] of sockets) {
        if (socket.userId === userId) {
          return true;
        }
      }
    }
    return false;
  }

  // Get connected users for an inspection
  static getConnectedUsersForInspection(inspectionId: string): string[] {
    const connectedUsers: string[] = [];
    if (this.io) {
      const sockets = this.io.sockets.sockets;
      for (const [socketId, socket] of sockets) {
        if (socket.rooms.has(`inspection-${inspectionId}`)) {
          connectedUsers.push(socket.userId);
        }
      }
    }
    return connectedUsers;
  }
}
