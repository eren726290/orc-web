#![forbid(unsafe_code)]

use serde::{Deserialize, Serialize};
use solidcraft_geom::Vec2;
use solidcraft_sketch::{Analysis, ConstraintKind, Hold, Sketch, SolveReport, solve_with};

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct Request {
    points: Vec<[f64; 2]>,
    curves: Vec<Curve>,
    rules: Vec<Rule>,
    drag: Option<Drag>,
    full: bool,
}

#[derive(Deserialize)]
#[serde(tag = "kind", rename_all = "snake_case", deny_unknown_fields)]
enum Curve {
    Line { from: usize, to: usize },
    Arc { from: usize, to: usize, center: usize, sweep: u8 },
}

#[derive(Deserialize)]
#[serde(tag = "kind", rename_all = "snake_case", deny_unknown_fields)]
enum Rule {
    Horizontal { segment: usize },
    Vertical { segment: usize },
    Perpendicular { first: usize, second: usize },
    Tangent { first: usize, second: usize },
}

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct Drag {
    point: usize,
    to: [f64; 2],
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct ResultGeometry {
    points: Vec<[f64; 2]>,
    ok: bool,
    dof: Option<usize>,
    iterations: usize,
    max_residual: f64,
    failing: Vec<usize>,
}

fn vector(point: [f64; 2]) -> Vec2 {
    Vec2 { x: point[0], y: point[1] }
}

fn point(sketch: &Sketch, index: usize) -> Result<Vec2, String> {
    let actual = index.checked_add(1).ok_or("Unknown solver point.")?;
    sketch.points.get(actual).map(|p| p.pos).ok_or_else(|| "Unknown solver point.".into())
}

fn add_curve(sketch: &mut Sketch, curve: &Curve) -> Result<(), String> {
    let result = match *curve {
        Curve::Line { from, to } => {
            point(sketch, from)?;
            point(sketch, to)?;
            sketch.add_line_pts(from + 1, to + 1, None)
        }
        Curve::Arc { from, to, center, sweep } => {
            if sweep > 1 { return Err("Unsupported arc direction.".into()); }
            let (a, b) = if sweep == 1 { (from, to) } else { (to, from) };
            sketch.add_arc(point(sketch, center)?, point(sketch, a)?, point(sketch, b)?,
                [Some(center + 1), Some(a + 1), Some(b + 1)], None)
        }
    };
    result.map(|_| ()).map_err(|e| e.to_string())
}

fn constraint(rule: &Rule) -> ConstraintKind {
    match *rule {
        Rule::Horizontal { segment } => ConstraintKind::Horizontal { l: segment },
        Rule::Vertical { segment } => ConstraintKind::Vertical { l: segment },
        Rule::Perpendicular { first, second } => ConstraintKind::Perpendicular { a: first, b: second },
        Rule::Tangent { first, second } => ConstraintKind::Tangent { a: first, b: second },
    }
}

fn sketch(request: &Request) -> Result<(Sketch, Vec<String>), String> {
    if request.points.len() >= solidcraft_sketch::MAX_POINTS ||
        request.curves.len() > solidcraft_sketch::MAX_CURVES ||
        request.rules.len() > solidcraft_sketch::MAX_CONSTRAINTS {
        return Err("The path exceeds the solver's existing safety limits.".into());
    }
    let mut sketch = Sketch::new();
    for p in &request.points { sketch.add_point(vector(*p), None).map_err(|e| e.to_string())?; }
    for curve in &request.curves { add_curve(&mut sketch, curve)?; }
    let mut ids = Vec::new();
    for rule in &request.rules {
        ids.push(sketch.add_constraint(constraint(rule), None).map_err(|e| e.to_string())?);
    }
    Ok((sketch, ids))
}

fn run(request: &Request, sketch: &mut Sketch) -> Result<SolveReport, String> {
    let reference: Vec<Vec2> = sketch.points.iter().map(|p| p.pos).collect();
    let mut hold = Hold::default();
    if let Some(drag) = &request.drag {
        let target = vector(drag.to);
        if !target.is_finite() || target.x.abs() >= solidcraft_sketch::MAX_COORD || target.y.abs() >= solidcraft_sketch::MAX_COORD {
            return Err("The dragged point is outside the supported coordinate range.".into());
        }
        let actual = drag.point.checked_add(1).ok_or("Unknown dragged anchor.")?;
        let p = sketch.points.get_mut(actual).ok_or("Unknown dragged anchor.")?;
        p.pos = target;
        hold.points.push(actual);
    }
    let analysis = if request.full { Analysis::Full } else { Analysis::StatusOnly };
    let report = solve_with(sketch, &hold, Some(&reference), analysis, None);
    if !report.ok() {
        for (p, before) in sketch.points.iter_mut().zip(reference) { p.pos = before; }
    }
    Ok(report)
}

pub fn solve(bytes: &[u8]) -> Result<Vec<u8>, String> {
    let request: Request = serde_json::from_slice(bytes).map_err(|e| e.to_string())?;
    let (mut sketch, ids) = sketch(&request)?;
    let report = run(&request, &mut sketch)?;
    let result = ResultGeometry {
        points: sketch.points.iter().skip(1).map(|p| [p.pos.x, p.pos.y]).collect(),
        ok: report.ok(),
        dof: if request.full { Some(report.dof) } else { None },
        iterations: report.iterations,
        max_residual: report.max_residual,
        failing: ids.iter().enumerate().filter_map(|(i, id)| report.failing.contains(id).then_some(i)).collect(),
    };
    serde_json::to_vec(&result).map_err(|e| e.to_string())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn contradictory_fixed_geometry_restores_every_point() {
        let request = Request { points: vec![[10.0, 10.0], [50.0, 20.0]],
            curves: vec![Curve::Line { from: 0, to: 1 }],
            rules: vec![Rule::Horizontal { segment: 0 }], drag: None, full: false };
        let (mut sketch, _) = sketch(&request).expect("valid fixture");
        for p in sketch.points.iter_mut().skip(1) { p.fixed = true; }
        let before = sketch.clone();
        let report = run(&request, &mut sketch).expect("valid fixed-point request");
        assert!(!report.ok());
        assert_eq!(sketch.points, before.points);
        assert_eq!(sketch.curves, before.curves);
        assert_eq!(sketch.constraints, before.constraints);
    }

    #[test]
    fn invalid_references_and_nonfinite_input_are_refused() {
        assert!(solve(br#"{"points":[[0,0]],"curves":[{"kind":"line","from":18446744073709551615,"to":0}],"rules":[],"drag":null,"full":false}"#).is_err());
        assert!(solve(br#"{"points":[[null,0]],"curves":[],"rules":[],"drag":null,"full":false}"#).is_err());
    }
}
