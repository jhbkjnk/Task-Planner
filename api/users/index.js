require("isomorphic-fetch");

const { Client } = require("@microsoft/microsoft-graph-client");
const { ClientSecretCredential } = require("@azure/identity");

function getGraphClient() {

    const tenantId = process.env.AAD_TENANT_ID;
    const clientId = process.env.AAD_CLIENT_ID;
    const clientSecret = process.env.AAD_CLIENT_SECRET;

    const credential = new ClientSecretCredential(
        tenantId,
        clientId,
        clientSecret
    );

    return Client.initWithMiddleware({
        authProvider: {
            getAccessToken: async () => {
                const token = await credential.getToken(
                    "https://graph.microsoft.com/.default"
                );
                return token.token;
            }
        }
    });
}

module.exports = async function (context, req) {

    try {

        const graph = getGraphClient();

        // MULTIPLE GROUPS
        const groupIds = [
            "c2861638-8302-4b8d-a172-840a78a1215e",
            "ce4524d8-8f66-4f29-862d-e1b949deca18"
        ];

        let allUsers = [];

        for (const groupId of groupIds) {

            const result = await graph
                .api(`/groups/${groupId}/members`)
                .select("displayName,mail,userPrincipalName,id")
                .top(999)
                .get();

            const users = result.value
                .map(user => ({
                    id: user.id,
                    displayName: user.displayName,
                    email: user.mail || user.userPrincipalName
                }))
                .filter(user => user.email);

            allUsers = allUsers.concat(users);
        }

        // REMOVE DUPLICATES
        const uniqueUsers = Array.from(
            new Map(allUsers.map(u => [u.email, u])).values()
        );

        context.res = {
            headers: { "Content-Type": "application/json" },
            body: uniqueUsers
        };

    } catch (error) {

        context.res = {
            status: 500,
            body: { error: error.toString() }
        };

    }
};
