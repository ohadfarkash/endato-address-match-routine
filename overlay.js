console.log('Loaded overlay.js')
let overlay_app = Vue.createApp({
    template: `
        <div class="overlay_zone" ref="overlay_zone">
        <Window/>
        </div>
    `,
    data() {
        return {
            count: 0
        };
    },
    methods: {
        increment() {
            this.count++;
        }
    },
    mounted() {
        this.$refs.overlay_zone.style.height = window.innerHeight + "px"
        this.$refs.overlay_zone.style.width = window.innerWidth + "px"
    }
})

overlay_app.component(
    'Window',
    {
        template: `
        <div class="o_window" ref="draggableContainer">
            <div class="o_grip" @mousedown="dragMouseDown">
                <div>Control-Pad</div>
            </div>
            <div class="o_contents">
                <RecordNav />
                <RecordLinks />
                <PhoneInput />
            </div>
        </div>
        `,
        data() {
            return {
                positions: {
                    clientX: undefined,
                    clientY: undefined,
                    movementX: 0,
                    movementY: 0
                }
            }
        },
        mounted() {
            this.$refs.draggableContainer.style.top = (window.innerHeight - this.$refs.draggableContainer.offsetHeight - 10) + 'px'
            this.$refs.draggableContainer.style.left = (window.innerWidth - this.$refs.draggableContainer.offsetWidth - 10) + 'px'
        },
        methods: {
            content_button_clicked() {
                load_record(3)
            },
            dragMouseDown: function (event) {
                event.preventDefault()
                // get the mouse cursor position at startup:
                this.positions.clientX = event.clientX
                this.positions.clientY = event.clientY
                document.onmousemove = this.elementDrag
                document.onmouseup = this.closeDragElement
            },
            elementDrag: function (event) {
                event.preventDefault()
                this.positions.movementX = this.positions.clientX - event.clientX
                this.positions.movementY = this.positions.clientY - event.clientY
                this.positions.clientX = event.clientX
                this.positions.clientY = event.clientY
                // set the element's new position:
                this.$refs.draggableContainer.style.top = (this.$refs.draggableContainer.offsetTop - this.positions.movementY) + 'px'
                this.$refs.draggableContainer.style.left = (this.$refs.draggableContainer.offsetLeft - this.positions.movementX) + 'px'
            },
            closeDragElement() {
                document.onmouseup = null
                document.onmousemove = null
            }
        }
    }
)

overlay_app.component(
    'RecordNav',
    {
        template: `
        <div class="o_record_nav">
            <h1>Selected Record:</h1>
            <div class="o_row">
                <button @click="prev_record"><</button>
                <div class="o_record_index">{{overlay_data.record_index}}</div>
                <button @click="next_record">></button>
            </div>
        </div>
        `,
        methods: {
            prev_record() {
                prev_record()
            },
            next_record() {
                next_record()
            }
        },
        data() {
            return {
                overlay_data: window.overlay_data
            }
        }
    }
)

overlay_app.component(
    'RecordLinks',
    {
        template: `
        <div class="o_record_links">
            <h1>Links:</h1>
            <button @click="search_county">Search {{overlay_data.county_name}} County Records</button>
            <NameSelector type="First Names" :names="overlay_data.first_names" @checked="changed_fn" :clearTrigger="clearTriggerValue"/>
            <div class="o_sep"></div>
            <NameSelector type="Middle Names" :names="overlay_data.middle_names" @checked="changed_mn" :clearTrigger="clearTriggerValue"/>
            <div class="o_sep"></div>
            <NameSelector type="Last Names" :names="overlay_data.last_names" @checked="changed_ln" :clearTrigger="clearTriggerValue"/>
            <div class="o_actions">
                <button @click="copy_selection">Copy Selection</button>
                <button @click="clear_selection">Clear Selection</button>
                <button @click="usphonebook">USPhoneBook Lookup</button>
                <button @click="beenverified">BeenVerified Lookup</button>
            </div>
        </div>
        `,
        methods: {
            search_county() {
                search_county()
            },
            changed_fn(e) {
                this.checked_fn = e
            },
            changed_mn(e) {
                this.checked_mn = e
            },
            changed_ln(e) {
                this.checked_ln = e
            },
            clear_selection() {
                this.clearTriggerValue = !this.clearTriggerValue
            },
            copy_selection() {
                let text = [].concat(this.checked_fn,this.checked_mn,this.checked_ln).join(' ')
                navigator.clipboard.writeText(text);
            },
            usphonebook() {
                let names = [].concat(this.checked_fn,this.checked_mn,this.checked_ln)
                usphonebook(names)
            },
            beenverified() {
                console.log("beenverified")
                beenverified(this.checked_fn, this.checked_mn, this.checked_ln)
            }
        },
        data() {
            return {
                overlay_data: window.overlay_data,
                checked_fn: [],
                checked_mn: [],
                checked_ln: [],
                clearTriggerValue: false
            }
        }
    }
)

overlay_app.component(
    'NameSelector',
    {
        template: `
        <div class="o_name_selector">
            <h1>{{type}}</h1>
            <div class="o_cards">
                <div v-for="name in names" :class="{ o_checked: checklist[name] }" @click="card_click(name)">
                    {{name}}
                </div>
            </div>
        </div>
        `,
        props: ['type', 'names', 'clearTrigger'],
        emits: ['checked'],
        watch: {
            clearTrigger() {
                this.clearSelections()
            }
        },
        data() {
            let checklist = {}
            for (let name of this.names) {
                checklist[name] = false
            }
            return {
                checklist
            }
        },
        methods: {
            card_click(name) {
                console.log("clicked " + name)
                this.checklist[name] = !this.checklist[name]
                let checked = []
                for (let check in this.checklist) {
                    if (this.checklist[check]) {
                        checked.push(check)
                    }
                }
                this.$emit('checked', checked)
            },
            clearSelections() {
                for (let name of this.names) {
                    this.checklist[name] = false
                }
                this.$emit('checked', [])
            }
        }
    }
)

overlay_app.component(
    'PhoneInput',
    {
        template:`
        <div class="o_phone_input">
            <h1>Phone Numbers:</h1>
            <div class="o_grid">
                <h2>Phone 1:</h2><input type="text" v-model="overlay_data.phone1" @input="input"/>
                <h2>Phone 2:</h2><input type="text" v-model="overlay_data.phone2" @input="input"/>
                <h2>Phone 3:</h2><input type="text" v-model="overlay_data.phone3" @input="input"/>
            </div>
            <button @click="save" v-if="showSave">Save</button>
        </div>
        `,
        methods: {
            save() {
                save_record(this.overlay_data)
                this.showSave = false
            },
            input() {
                this.showSave = true
                console.log(this.showSave)
            }
        },
        data() {
            return {
                overlay_data: window.overlay_data,
                showSave: false
            }
        }
    }
)

let div = document.createElement('div')
div.className = "mountable"
document.body.append(div)
overlay_app.mount('.mountable')
