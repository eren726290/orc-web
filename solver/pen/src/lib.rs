//! Small numeric exchange boundary; each WASM instance owns its buffers.
#![deny(unsafe_op_in_unsafe_fn)]

mod request;

use std::cell::RefCell;

#[derive(Default)]
struct Exchange {
    input: Vec<u8>,
    output: Vec<u8>,
}

thread_local! {
    static EXCHANGE: RefCell<Exchange> = RefCell::new(Exchange::default());
}

#[unsafe(no_mangle)]
pub extern "C" fn input_resize(length: usize) -> usize {
    if length == 0 || length > 16 * 1024 * 1024 {
        return 0;
    }
    EXCHANGE.with(|state| {
        let mut state = state.borrow_mut();
        state.input.resize(length, 0);
        state.input.as_mut_ptr() as usize
    })
}

#[unsafe(no_mangle)]
pub extern "C" fn output_ptr() -> usize {
    EXCHANGE.with(|state| state.borrow().output.as_ptr() as usize)
}

#[unsafe(no_mangle)]
pub extern "C" fn solve_request() -> usize {
    EXCHANGE.with(|state| {
        let mut state = state.borrow_mut();
        state.output = match request::solve(&state.input) {
            Ok(result) => result,
            Err(error) => serde_json::json!({ "error": error }).to_string().into_bytes(),
        };
        state.output.len()
    })
}
