const dashboards = new Map();
const GRID_COLS = 4;
const compactWidgets = (widgets) => {
    return [...widgets]
        .sort((a, b) => {
            if (a.row === b.row) return a.col - b.col;
            return a.row - b.row;
        })
        .map((widget, index) => ({
            ...widget,
            row: Math.floor(index / GRID_COLS) + 1,
            col: (index % GRID_COLS) + 1
        }));
};

module.exports = (io) => {

    io.on("connection", (socket) => {

        console.log("Connected", socket.id);

        socket.on("join-workspace", ({ workspaceId,role }) => {

            socket.join(workspaceId);
            socket.workspaceId = workspaceId;
            socket.role = role;

            if (!dashboards.has(workspaceId)) {
                dashboards.set(workspaceId, []);
            }

            socket.emit(
                "dashboard-state",
                dashboards.get(workspaceId)
            );

            console.log(socket.id, "joined", workspaceId);
        });

        socket.on("dashboard-action", (payload) => {

            const {
                workspaceId,
                action,
                data
            } = payload;

            let widgets = dashboards.get(workspaceId) || [];

            const permissions = {
                Admin: [
                    "ADD_WIDGET",
                    "DELETE_WIDGET",
                    "MOVE_WIDGET",
                    "RESIZE_WIDGET"
                ],

                Analyst: [
                    "RESIZE_WIDGET"
                ],

                Viewer: []
            };

            const allowedActions = permissions[socket.role] || [];

            if (!allowedActions.includes(action)) {

                socket.emit("permission-denied", {
                    message: "You don't have permission."
                });

                return;
            }


            switch (action) {

                case "ADD_WIDGET":

                    widgets.push(data);

                    break;

                case "DELETE_WIDGET":

                    widgets = widgets.filter(
                        w => w.id !== data.widgetId
                    );

                    widgets = compactWidgets(widgets);
                    dashboards.set(workspaceId, widgets);
                    io.to(workspaceId).emit(
                        "dashboard-state",
                        widgets
                    );

                    break;

                case "MOVE_WIDGET":

                    widgets = widgets.map(widget => {

                        if (widget.id !== data.widgetId)
                            return widget;

                        return {
                            ...widget,
                            col: data.col,
                            row: data.row
                        };

                    });

                    break;

                case "RESIZE_WIDGET":

                    widgets = widgets.map(widget => {

                        if (widget.id !== data.widgetId)
                            return widget;

                        return {
                            ...widget,
                            w: data.w,
                            h: data.h
                        };

                    });

                    break;
            }

            dashboards.set(workspaceId, widgets);

            io.to(workspaceId).emit(
                "dashboard-state",
                widgets
            );

        });

        socket.on("disconnect", () => {

            console.log(socket.id, "Disconnected");

        });

    });

};