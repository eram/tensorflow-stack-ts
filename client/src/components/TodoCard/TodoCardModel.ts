import { Component } from "react";
import { ClientWrapper } from "../../utils";
import { StateMachine, tFrom } from "../../utils";
import { endpoint /* , getNameStateQuery, IGetNameStateResp */ } from "../GraphqlTypes";

enum ModelState { loading, data, err, dismounted }
enum Event { getData, onData, addTodo, toggelTodo, onErr, unmount }

interface ITodoItem {
    id: number;
    key: number;
    name: string;
    isCompleted: boolean;
}

interface ICompState {
    todoItems: ITodoItem[];
    modalVisible: boolean;
    newTaskName: string;
    maxTaskId: number;
    errStr: string;
    model: TodoCardModel;
}

class TodoCardModel {

    private comp: Component;
    private fsm: StateMachine<ModelState, Event>;
    private client: ClientWrapper;

    constructor(comp: Component, client?: ClientWrapper, fsm?: StateMachine<ModelState, Event>) {
        this.comp = comp;
        this.fsm = fsm || new StateMachine<ModelState, Event>(ModelState.loading, [
            tFrom(ModelState.loading, Event.getData, ModelState.loading, this.onGetData.bind(this)),
            tFrom(ModelState.loading, Event.onData, ModelState.data, this.onData.bind(this)),
            tFrom(ModelState.loading, Event.onErr, ModelState.err, this.onErr.bind(this)),
            tFrom(ModelState.data, Event.onErr, ModelState.err, this.onErr.bind(this)),

            tFrom(ModelState.data, Event.addTodo, ModelState.data, this.OnAddTodo.bind(this)),
            tFrom(ModelState.data, Event.toggelTodo, ModelState.data, this.OnToggleTodo.bind(this)),

            tFrom(ModelState.loading, Event.unmount, ModelState.dismounted),
            tFrom(ModelState.data, Event.unmount, ModelState.dismounted),
            tFrom(ModelState.err, Event.unmount, ModelState.dismounted),
        ]);
        this.client = client || new ClientWrapper(endpoint);
    }

    init(): ICompState {
        // kick start state machine
        this.fsm.dispatch(Event.getData);
        return {
            errStr: "",
            model: this,
            todoItems: [],
            modalVisible: false,
            newTaskName: "",
            maxTaskId: -1,
        };
    }

    getState() {
        return this.fsm.getState();
    }

    unmount() {
        // sync call
        this.fsm.dispatch(Event.unmount);
    }

    addTodo(todo: ITodoItem) {
        return this.fsm.dispatch(Event.addTodo, todo);
    }

    toggleTodo(id: number) {
        return this.fsm.dispatch(Event.toggelTodo, id);
    }

    // privates methods
    private async onGetData(): Promise<void> {

        // const rc = await this.client.request<undefined, IGetNameStateResp>(getNameStateQuery);

        const todoItems: ITodoItem[] = [{
            key: 0,
            id: 0,
            name: "Create a template for react and typescript.",
            isCompleted: true,
        }, {
            key: 1,
            id: 1,
            name: "Wire up redux to the template.",
            isCompleted: false,
        }];

        const rc = todoItems instanceof Array;

        if (rc) {
            this.fsm.dispatch(Event.onData, todoItems);
        } else {
            this.fsm.dispatch(Event.onErr, this.client.getErr());
        }
    }

    private onData(data: [ITodoItem[]]): void {

        let newState = {} as Partial<ICompState>;

        if (data && data instanceof Array && data.length === 1) {
            newState = { todoItems: data[0] };
        }

        if (newState.todoItems === undefined || !(newState.todoItems instanceof Array)
            || ((newState.todoItems!.length > 0)
                && (newState.todoItems[0].id === undefined
                    || newState.todoItems[0].isCompleted === undefined
                    || newState.todoItems[0].key === undefined
                    || newState.todoItems[0].name === undefined))) {
            this.fsm.dispatch(Event.onErr, `Invalid data: ${JSON.stringify(data)}`);
            return;
        }

        newState.maxTaskId = -1;
        newState.todoItems.forEach( (todo: ITodoItem) => {
            newState.maxTaskId = Math.max(newState.maxTaskId!, todo.id);
        });

        this.comp.setState(newState);
    }

    private onErr(errStr: string): void {
        const newState = { errStr };
        this.comp.setState(newState);
    }

    private async OnAddTodo(data: [ITodoItem]) {

        const todo = data[0];
        const { todoItems, maxTaskId } = this.comp.state as ICompState;
        const newState: Partial<ICompState> = { todoItems };
        todo.id = newState.maxTaskId =  1 + maxTaskId!;
        // TODO: await call client
        newState.todoItems!.push(todo);
        this.comp.setState(newState);
    }

    private async OnToggleTodo(data: [number]) {

        const id = data[0];
        const { todoItems } = this.comp.state as ICompState;
        const newState: Partial<ICompState> = { todoItems };
        // TODO: await call client
        const todo = newState.todoItems!.find((val: ITodoItem) => (val.id === id));
        if (todo) {
            todo.isCompleted = !todo.isCompleted;
        }
        this.comp.setState(newState);
    }

}

export { ITodoItem, ICompState, ModelState, TodoCardModel };
