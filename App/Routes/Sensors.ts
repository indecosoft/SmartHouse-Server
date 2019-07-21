import { executeQuery } from "../Utils/db";
import * as query from './routes.query';
import mqttConnection from '../Utils/Mqtt'
class Sensors {
    constructor() { }
    register = async (ctx: any) => {
        console.log(ctx.request.body);

        if ((await executeQuery(query.searchSensor(ctx.request.body.macAddress)))[0].count == 0) {
            await executeQuery(query.insertSensor(ctx.request.body.sensorName, ctx.request.body.macAddress, ctx.request.body.sensorType));
            mqttConnection.subscribe(ctx.request.body.sensorName);
            ctx.body = { success: "sensor saved" };
        } else {
            ctx.body = { success: "sensor already exist" };
        }
    }
    async sendEventToSensor(ctx:any){
        const payload = {
            sensorName: ctx.request.body.sensorName,
            event: ctx.request.body.event
        }
        console.log(JSON.stringify(payload));
        mqttConnection.publish("SensorsSetingsChannel",JSON.stringify(payload));
        ctx.body = { success: "event sent successfully" };

    }
}
export default new Sensors();