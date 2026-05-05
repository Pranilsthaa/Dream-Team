import axios from "axios";
import Config from "react-native-config";

const apiInstance = axios.create({
    baseURL: Config.BASE_URL,
    headers: {
        "Content-Type": "application/json"
    }
})

apiInstance.interceptors.request.use(config => {
    if(__DEV__){
        console.log({
            method: config.method,
            route: (config.baseURL ?? "" )+ config.url,
        })
    }
    return config
})

apiInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            
        }
    }
)

export default apiInstance;