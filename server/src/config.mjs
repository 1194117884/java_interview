export function getModelConfig(env = process.env) {
    return {
        provider: env.MODEL_PROVIDER || 'local',
        model: env.MODEL_NAME || 'rule-based',
        apiKey: env.MODEL_API_KEY,
    }
}
